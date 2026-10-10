/**
 * WORKBRIDGE - CLOUD DATABASE CLIENT ADAPTER
 * File: js/api/supabaseClient.js
 * 
 * Direct serverless persistence via Supabase PostgreSQL.
 */

const SUPABASE_URL = 'https://fhlcvdhhqzpnyvbwvzou.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZobGN2ZGhocXpwbnl2Ynd2em91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1OTgzMTQsImV4cCI6MjEwNzE3NDMxNH0.qwk0f4r1IXu8MpV8yKE1ZQeShm0tbIg6hxEPt7vqKyY';

// Initialize global Supabase connection instance
if (window.supabase) {
    window.sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('WorkBridge Cloud Engine: Connected to Supabase PostgreSQL.');
} else {
    console.error('WorkBridge Engine: Supabase CDN not loaded. Ensure CDN script tag is placed before this file.');
}