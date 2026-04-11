/**
 * Web Crypto API Utility for E2E Encryption
 */

const AppCrypto = {
    // === SHA-256 Hashing ===
    async hashPassword(password) {
        const msgUint8 = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    // === AES-GCM Encryption (Symmetric, Password-based) ===
    async _getAESKey(password) {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]
        );
        // Using a fixed static salt for simplicity since hashes are per-project
        const salt = enc.encode("QuizOpus_Salt_2026");
        return crypto.subtle.deriveKey(
            { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    },

    async encryptAES(text, password) {
        const key = await this._getAESKey(password);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const enc = new TextEncoder();
        
        const encrypted = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            enc.encode(text)
        );
        
        // Return Base64 of IV + Ciphertext
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encrypted), iv.length);
        
        return btoa(String.fromCharCode.apply(null, combined));
    },

    async decryptAES(base64Data, password) {
        const key = await this._getAESKey(password);
        const combined = new Uint8Array(atob(base64Data).split('').map(c => c.charCodeAt(0)));
        const iv = combined.slice(0, 12);
        const data = combined.slice(12);
        
        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            data
        );
        return new TextDecoder().decode(decrypted);
    },

    // === RSA-OAEP Encryption (Asymmetric, E2E) ===
    async generateRSAKeyPair() {
        const keyPair = await crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["encrypt", "decrypt"]
        );
        
        const pubJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
        const privJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
        
        return { publicKeyJwk: pubJwk, privateKeyJwk: privJwk };
    },

    async encryptRSA(text, publicKeyJwk) {
        const publicKey = await crypto.subtle.importKey(
            "jwk",
            publicKeyJwk,
            { name: "RSA-OAEP", hash: "SHA-256" },
            false,
            ["encrypt"]
        );
        const enc = new TextEncoder();
        const encrypted = await crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            publicKey,
            enc.encode(text)
        );
        return btoa(String.fromCharCode.apply(null, new Uint8Array(encrypted)));
    },

    async decryptRSA(base64Data, privateKeyJwk) {
        const privateKey = await crypto.subtle.importKey(
            "jwk",
            privateKeyJwk,
            { name: "RSA-OAEP", hash: "SHA-256" },
            false,
            ["decrypt"]
        );
        const data = new Uint8Array(atob(base64Data).split('').map(c => c.charCodeAt(0)));
        const decrypted = await crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            data
        );
        return new TextDecoder().decode(decrypted);
    }
};
window.AppCrypto = AppCrypto;
