'use-strict';

/**
 * @typedef {{ protocol?: "https"|"http", hostname: string, port?: string, path: string, headers?: { "Authorization"?: string, "Content-Type"?: string } }} requestOptions
 */

import http from 'node:http';
import https from 'node:https';

/**
 * Perform a HTTP request.
 * @param {requestOptions} [requestOptions] - Options for the request.
 * @param {string} [data] - The data to send.
 * @returns {Promise<string|object|any>}
 */
export async function request(requestOptions = {}, data = '') {
    if (typeof data === 'object') {
        data = JSON.stringify(data);
    }

    return new Promise((resolve, reject) => {
        const request = (requestOptions.protocol === 'http' ? http : https).request(
            {
                hostname: requestOptions.hostname,
                port: requestOptions.port,
                path: (requestOptions.path[0] !== '/' ? '/' : '') + requestOptions.path,
                method: requestOptions.method || 'GET',
                headers: Object.assign(requestOptions.method === 'GET' ? {} : { 'Content-Length': data.length }, requestOptions.headers)
            },
            data => {
                let update = '';

                data.on('data', d => (update += d));
                data.on('error', reject);

                data.on('end', () => {
                    try {
                        update = JSON.parse(update);
                    } catch (err) {}

                    resolve(update);
                });
            }
        );

        request.on('error', reject);

        if (requestOptions.method !== 'GET') {
            request.write(data);
        }

        request.end();
    });
}

/**
 * Perform a HTTP GET request.
 * @param {requestOptions} [requestOptions] - Options for the request.
 * @param {string} [data] - The data to send.
 * @returns {Promise<string|object|any>}
 */
export function GET(requestOptions = {}, data = '') {
    return request(Object.assign({ method: 'GET' }, requestOptions), data);
}

/**
 * Perform a HTTP POST request.
 * @param {requestOptions} [requestOptions] - Options for the request.
 * @param {string} [data] - The data to send.
 * @returns {Promise<string|object|any>}
 */
export function POST(requestOptions = {}, data = '') {
    return request(Object.assign({ method: 'POST' }, requestOptions), data);
}

/**
 * Perform a HTTP PATCH request.
 * @param {requestOptions} [requestOptions] - Options for the request.
 * @param {string} [data] - The data to send.
 * @returns {Promise<string|object|any>}
 */
export function PATCH(requestOptions = {}, data = '') {
    return request(Object.assign({ method: 'PATCH' }, requestOptions), data);
}

/**
 * Perform a HTTP PUT request.
 * @param {requestOptions} [requestOptions] - Options for the request.
 * @param {string} [data] - The data to send.
 * @returns {Promise<string|object|any>}
 */
export function PUT(requestOptions = {}, data = '') {
    return request(Object.assign({ method: 'PUT' }, requestOptions), data);
}

/**
 * Perform a HTTP DELETE request.
 * @param {requestOptions} [requestOptions] - Options for the request.
 * @param {string} [data] - The data to send.
 * @returns {Promise<string|object|any>}
 */
export function DELETE(requestOptions = {}, data = '') {
    return request(Object.assign({ method: 'DELETE' }, requestOptions), data);
}

export default request;
