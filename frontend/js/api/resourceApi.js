/**
 * WORKBRIDGE - RESOURCE MANAGEMENT API MODULE
 * File: js/api/resourceApi.js
 * 
 * Coordinates persistent project asset uploads via multipart/form-data,
 * metadata retrieval, and deletion in the Resource Vault.
 */

const ResourceApi = (function () {
    /**
     * Fetch all permanent resources registered under a project.
     * @param {string|number} projectId
     * @returns {Promise<Array<Object>>} List of resource items
     */
    async function getResources(projectId) {
        return window.ApiClient.get(`/resources/project/${projectId}`);
    }

    /**
     * Upload an asset file with description to the project vault.
     * Uses multipart/form-data via ApiClient.
     * @param {string|number} projectId
     * @param {File} file - Native browser File object
     * @param {string} [description] - Optional notes
     * @returns {Promise<Object>} Created resource entity
     */
    async function uploadResource(projectId, file, description = '') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('description', description);

        return window.ApiClient.post('/resources/upload', formData);
    }

    /**
     * Download or retrieve binary resource content URL.
     * @param {string|number} resourceId
     * @returns {string} Download URL
     */
    function getDownloadUrl(resourceId) {
        const baseUrl = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || 'http://localhost:8080/api';
        return `${baseUrl}/resources/download/${resourceId}`;
    }

    /**
     * Remove an asset entry from the project vault.
     * @param {string|number} resourceId
     * @returns {Promise<Object>} Confirmation response
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