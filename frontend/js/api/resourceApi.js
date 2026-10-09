/**
 * WORKBRIDGE - RESOURCE MANAGEMENT API MODULE
 * File: js/api/resourceApi.js
 * 
 * Coordinates persistent project asset uploads, link registrations (Figma, GitHub, Docs),
 * metadata retrieval, and deletion in the Resource Vault.
 */

const ResourceApi = (function () {
    const endpoints = window.APP_CONFIG?.ENDPOINTS?.RESOURCES || {};

    /**
     * Fetch all permanent resources registered under a project.
     * @param {string|number} projectId
     * @returns {Promise<Array<Object>>} List of resource items
     */
    async function getResources(projectId) {
        const path = typeof endpoints.LIST === 'function'
            ? endpoints.LIST(projectId)
            : `/resources/project/${projectId}`;

        try {
            const data = await window.ApiClient.get(path);
            return Array.isArray(data) ? data : (data?.resources || []);
        } catch (err) {
            console.warn('Could not fetch resources for project:', err.message);
            return [];
        }
    }

    /**
     * Save an asset to the Resource Vault.
     * Flexibly handles both native File uploads (multipart/form-data)
     * and external Link registrations (Figma, GitHub PR, Cloud Docs) from Modal 5.
     * 
     * @param {string|number} projectId
     * @param {Object} assetData - { title, type, url, file, description }
     * @returns {Promise<Object>} Created resource entity
     */
    async function uploadResource(projectId, assetData) {
        const uploadPath = typeof endpoints.UPLOAD === 'function'
            ? endpoints.UPLOAD(projectId)
            : `/resources/project/${projectId}/upload`;

        // Case 1: Binary File Upload via FormData
        if (assetData.file instanceof File || assetData instanceof File) {
            const file = assetData.file || assetData;
            const formData = new FormData();
            formData.append('file', file);
            formData.append('projectId', String(projectId));
            formData.append('title', assetData.title || file.name);
            formData.append('type', assetData.type || 'DOCUMENT');
            if (assetData.description) formData.append('description', assetData.description);

            try {
                return await window.ApiClient.post(uploadPath, formData);
            } catch (err) {
                return await window.ApiClient.post('/resources/upload', formData);
            }
        }

        // Case 2: URL / Link Asset Registration (Figma, Docs, API link)
        const payload = {
            projectId: Number(projectId),
            title: assetData.title || 'Project Asset',
            type: assetData.type || 'DOCUMENT',
            url: assetData.url || assetData.resourceUrl || '',
            description: assetData.description || 'Registered via Resource Vault.'
        };

        try {
            return await window.ApiClient.post(uploadPath, payload);
        } catch (err) {
            return await window.ApiClient.post(`/resources/project/${projectId}`, payload);
        }
    }

    /**
     * Download or retrieve resource URL.
     * If already an external absolute URL (https://figma.com...), returns directly.
     * @param {Object|string|number} resourceOrId
     * @returns {string} Download / View URL
     */
    function getDownloadUrl(resourceOrId) {
        if (typeof resourceOrId === 'object' && resourceOrId !== null) {
            if (resourceOrId.url && (resourceOrId.url.startsWith('http://') || resourceOrId.url.startsWith('https://'))) {
                return resourceOrId.url;
            }
            return getDownloadUrl(resourceOrId.id);
        }

        const baseUrl = window.APP_CONFIG?.SERVER_ROOT || 'http://localhost:8080';
        return `${baseUrl}/api/resources/download/${resourceOrId}`;
    }

    /**
     * Remove an asset entry from the project vault.
     * @param {string|number} resourceId
     * @returns {Promise<Object>}
     */
    async function deleteResource(resourceId) {
        return window.ApiClient.delete(`/resources/${resourceId}`);
    }

    return {
        getResources,
        uploadResource,
        getDownloadUrl,
        deleteResource
    };
})();

// Attach to global window
window.ResourceApi = ResourceApi;