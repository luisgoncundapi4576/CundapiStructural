// netlify/functions/comments.js
//
// Backend serverless para las opiniones/comentarios del sitio.
// Almacena los comentarios en Netlify Blobs (persistente, sin base de datos externa).
//
// GET  /.netlify/functions/comments      -> devuelve todos los comentarios (más recientes primero)
// POST /.netlify/functions/comments      -> agrega un comentario nuevo { name, course, rating, comment }

const { getStore } = require('@netlify/blobs');

const STORE_NAME = 'opiniones';
const KEY = 'comments.json';
const MAX_COMMENTS = 500; // límite de seguridad para no crecer sin control

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const store = getStore(STORE_NAME);

  if (event.httpMethod === 'GET') {
    const data = (await store.get(KEY, { type: 'json' })) || [];
    const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(sorted) };
  }

  if (event.httpMethod === 'POST') {
    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (err) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'JSON inválido.' }) };
    }

    const name = (payload.name || '').toString().trim().slice(0, 80);
    const course = (payload.course || '').toString().trim().slice(0, 120);
    const comment = (payload.comment || '').toString().trim().slice(0, 600);
    const ratingNum = parseInt(payload.rating, 10);

    if (!name || !course || !comment) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Nombre, curso y comentario son obligatorios.' })
      };
    }
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'La calificación debe ser un entero entre 1 y 5.' })
      };
    }

    const entry = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      name: escapeHtml(name),
      course: escapeHtml(course),
      comment: escapeHtml(comment),
      rating: ratingNum,
      date: new Date().toISOString()
    };

    const data = (await store.get(KEY, { type: 'json' })) || [];
    data.push(entry);
    if (data.length > MAX_COMMENTS) {
      data.splice(0, data.length - MAX_COMMENTS);
    }
    await store.set(KEY, JSON.stringify(data));

    return { statusCode: 201, headers: CORS_HEADERS, body: JSON.stringify(entry) };
  }

  return {
    statusCode: 405,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: 'Método no permitido.' })
  };
};
