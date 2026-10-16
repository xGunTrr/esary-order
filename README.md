# Easy Order 🍔

## Instalación
```sh
npm install
```

## Iniciar la app
En una terminal iniciamos
```sh
npx expo start
```

En otra terminal ejecutamos
```sh
npm run api
```

Para acceder al proyecto ingresamos a `http://localhost:8081`

## API

Para consumir la api usamos la ruta `http://localhost:3001`

- GET: `/orders`
- POST: `/orders` para enviar se usa el modelo Order de la app
- PATCH: `/orders/:id/status`. El cuerpo es { "status" : "En preparación"}