/**
 * WORKBRIDGE - CLOUD DATABASE CLIENT ADAPTER
 * File: js/api/supabaseClient.js
 * 
 * Direct serverless persistence via Supabase PostgreSQL.
 * Provides resilient singleton initialization on window.sbClient.
 */

(function () {
    const SUPABASE_URL = 'https://fhlcvdhhqzpnyvbwvzou.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobGN2ZGhocXpwbnl2Ynd2em91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1OTgzMTQsImV4cCI6MjEwNzE3NDMxNH0.qwk0f4r1IXu8MpV8yKE1ZQeShm0tbIg6hxEPt7vqKyY';

    // Singleton check: prevent re-instantiation
    if (window.sbClient) {
        return;
    }

    if (window.supabase && typeof window.supabase.createClient === 'function') {
        try {
            window.sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true
                }
            });
            console.log('WorkBridge Cloud Engine: Connected to Supabase PostgreSQL cluster.');
        } catch (err) {
            console.error('WorkBridge Cloud Engine: Failed to initialize Supabase client:', err);
        }
    } else {
        console.error('WorkBridge Engine: Supabase CDN not loaded. Ensure @supabase/supabase-js is loaded before supabaseClient.js.');
    }
})();