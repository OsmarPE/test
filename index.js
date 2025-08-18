const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());
app.use(cors())
// Middleware para parsear datos de formularios
app.use(express.urlencoded({ extended: true }));

// Ruta básica
app.get('/', (req, res) => {
  res.json({
    message: 'Servidor Express funcionando correctamente!',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});


// Ruta de ejemplo para POST
app.post('/api/data', (req, res) => {
  const { body } = req;
  console.log('Datos recibidos:', body);  
  res.json({
    message: 'Datos recibidos correctamente',
    data: body
  });
});


// Middleware para manejo de errores
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Express corriendo en http://localhost:${PORT}`);
  console.log(`📊 Health check disponible en http://localhost:${PORT}/health`);
  console.log(`📋 API endpoint ejemplo en http://localhost:${PORT}/api/data`);
});

module.exports = app;