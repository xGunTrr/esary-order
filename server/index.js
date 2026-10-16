const { createServer } = require('node:http');
const { mkdir, readFile, rename, writeFile } = require('node:fs/promises');
const path = require('node:path');

const host = process.env.API_HOST || '0.0.0.0';
const port = Number(process.env.API_PORT || 3001);
const dataDirectory = path.join(__dirname, 'data');
const dataFile = path.join(dataDirectory, 'orders.json');
const statuses = new Set(['Pendiente', 'En preparación', 'Listo', 'Entregado']);
const tables = new Set(Array.from({ length: 10 }, (_, index) => `Mesa ${index + 1}`));
let transactionQueue = Promise.resolve();

async function readOrders() {
  try {
    const contents = await readFile(dataFile, 'utf8');
    const orders = JSON.parse(contents);
    if (!Array.isArray(orders)) throw new Error('El archivo de pedidos debe contener una lista.');
    return orders;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await mkdir(dataDirectory, { recursive: true });
    await writeFile(dataFile, '[]\n', 'utf8');
    return [];
  }
}

async function writeOrders(orders) {
  await mkdir(dataDirectory, { recursive: true });
  const temporaryFile = `${dataFile}.tmp`;
  await writeFile(temporaryFile, `${JSON.stringify(orders, null, 2)}\n`, 'utf8');
  await rename(temporaryFile, dataFile);
}

function updateOrders(update) {
  const transaction = transactionQueue.then(async () => {
    const currentOrders = await readOrders();
    const { orders, result } = update(currentOrders);
    await writeOrders(orders);
    return result;
  });
  transactionQueue = transaction.then(() => undefined, () => undefined);
  return transaction;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    let tooLarge = false;
    request.on('data', (chunk) => {
      if (tooLarge) return;
      body += chunk;
      if (Buffer.byteLength(body, 'utf8') > 1_000_000) {
        tooLarge = true;
        reject(Object.assign(new Error('El cuerpo supera el límite de 1 MB.'), { statusCode: 413 }));
      }
    });
    request.on('end', () => {
      if (tooLarge) return;
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(Object.assign(new Error('El cuerpo debe ser JSON válido.'), { statusCode: 400 }));
      }
    });
    request.on('error', reject);
  });
}

function validateOrder(order) {
  if (!order || typeof order !== 'object') return 'El pedido debe ser un objeto JSON.';
  if (!tables.has(order.table)) return 'La mesa debe ser una de las 10 mesas disponibles.';
  if (typeof order.waiter !== 'string' || !order.waiter.trim()) return 'El pedido debe incluir el nombre del mesero.';
  if (!Array.isArray(order.items) || order.items.length === 0) return 'El pedido debe incluir al menos un producto.';
  if (!order.items.every((item) => item && typeof item.name === 'string' && item.name.trim() && Number.isInteger(item.quantity) && item.quantity > 0 && Array.isArray(item.details))) {
    return 'Cada producto debe incluir nombre, cantidad válida y detalles.';
  }
  return null;
}

const server = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  try {
    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, { status: 'ok', service: 'easyOrder API' });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/orders') {
      await transactionQueue;
      sendJson(response, 200, await readOrders());
      return;
    }

    if (request.method === 'POST' && url.pathname === '/orders') {
      const body = await readRequestBody(request);
      const validationError = validateOrder(body);
      if (validationError) {
        sendJson(response, 400, { error: validationError });
        return;
      }

      const order = await updateOrders((orders) => {
        const candidateId = Number(body.id);
        const id = Number.isSafeInteger(candidateId) && !orders.some((item) => Number(item.id) === candidateId)
          ? candidateId
          : Math.max(Date.now(), ...orders.map((item) => Number(item.id) || 0)) + 1;
        const newOrder = {
          ...body,
          id,
          createdAt: typeof body.createdAt === 'string' ? body.createdAt : new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
          status: 'Pendiente',
        };
        return { orders: [newOrder, ...orders], result: newOrder };
      });
      sendJson(response, 201, order);
      return;
    }

    const statusMatch = url.pathname.match(/^\/orders\/(\d+)\/status$/);
    if (request.method === 'PATCH' && statusMatch) {
      const body = await readRequestBody(request);
      if (!statuses.has(body.status)) {
        sendJson(response, 400, { error: 'Estado no válido.' });
        return;
      }

      const orderId = Number(statusMatch[1]);
      await updateOrders((orders) => {
        const orderIndex = orders.findIndex((order) => Number(order.id) === orderId);
        if (orderIndex < 0) throw Object.assign(new Error('No se encontró el pedido.'), { statusCode: 404 });
        const updatedOrder = { ...orders[orderIndex], status: body.status };
        orders[orderIndex] = updatedOrder;
        return { orders, result: updatedOrder };
      });
      response.writeHead(204);
      response.end();
      return;
    }

    sendJson(response, 404, { error: 'Ruta no encontrada.' });
  } catch (error) {
    if (!response.headersSent) {
      sendJson(response, error.statusCode || 500, { error: error.message || 'Error interno del servidor.' });
    }
  }
});

server.listen(port, host, () => {
  console.log(`easyOrder API escuchando en http://${host}:${port}`);
});
