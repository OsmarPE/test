const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la base de datos SQLite
const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con SQLite:', err.message);
  } else {
    console.log('📁 Conectado a la base de datos SQLite');
  }
});

// Crear tabla si no existe
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS received_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT
  )`, (err) => {
    if (err) {
      console.error('Error al crear la tabla:', err.message);
    } else {
      console.log('✅ Tabla "received_data" lista');
    }
  });
});

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


// Ruta de ejemplo para POST - Guardar datos en SQLite
app.post('/api/data', (req, res) => {
  const { body } = req;
  const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  const userAgent = req.get('User-Agent');
  
  console.log('Datos recibidos:', body);
  
  // Guardar en la base de datos
  const dataString = JSON.stringify(body);
  
  db.run(`INSERT INTO received_data (data, ip_address, user_agent) VALUES (?, ?, ?)`, 
    [dataString, clientIp, userAgent], 
    function(err) {
      if (err) {
        console.error('Error al guardar en la DB:', err.message);
        return res.status(500).json({
          error: 'Error al guardar los datos',
          message: err.message
        });
      }
      
      res.json({
        message: 'Datos recibidos y guardados correctamente',
        id: this.lastID,
        data: body,
        saved_at: new Date().toISOString()
      });
    }
  );
});

// Ruta para obtener todos los datos guardados
app.get('/api/data', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  // Obtener el total de registros
  db.get(`SELECT COUNT(*) as total FROM received_data`, (err, countResult) => {
    if (err) {
      console.error('Error al contar registros:', err.message);
      return res.status(500).json({
        error: 'Error al obtener el conteo de datos'
      });
    }
    
    // Obtener los datos paginados
    db.all(`SELECT * FROM received_data ORDER BY timestamp DESC LIMIT ? OFFSET ?`, 
      [limit, offset], 
      (err, rows) => {
        if (err) {
          console.error('Error al obtener datos:', err.message);
          return res.status(500).json({
            error: 'Error al obtener los datos'
          });
        }
        
        // Parsear los datos JSON
        const formattedRows = rows.map(row => ({
          id: row.id,
          data: JSON.parse(row.data),
          timestamp: row.timestamp,
          ip_address: row.ip_address,
          user_agent: row.user_agent
        }));
        
        res.json({
          data: formattedRows,
          pagination: {
            page: page,
            limit: limit,
            total: countResult.total,
            totalPages: Math.ceil(countResult.total / limit)
          }
        });
      }
    );
  });
});

// Ruta para obtener un dato específico por ID
app.get('/api/data/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(`SELECT * FROM received_data WHERE id = ?`, [id], (err, row) => {
    if (err) {
      console.error('Error al obtener dato:', err.message);
      return res.status(500).json({
        error: 'Error al obtener el dato'
      });
    }
    
    if (!row) {
      return res.status(404).json({
        error: 'Dato no encontrado'
      });
    }
    
    res.json({
      id: row.id,
      data: JSON.parse(row.data),
      timestamp: row.timestamp,
      ip_address: row.ip_address,
      user_agent: row.user_agent
    });
  });
});

// Ruta para eliminar un dato específico
app.delete('/api/data/:id', (req, res) => {
  const { id } = req.params;
  
  db.run(`DELETE FROM received_data WHERE id = ?`, [id], function(err) {
    if (err) {
      console.error('Error al eliminar dato:', err.message);
      return res.status(500).json({
        error: 'Error al eliminar el dato'
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({
        error: 'Dato no encontrado'
      });
    }
    
    res.json({
      message: 'Dato eliminado correctamente',
      id: parseInt(id)
    });
  });
});

// Ruta para obtener estadísticas de los datos
app.get('/api/stats', (req, res) => {
  db.all(`
    SELECT 
      COUNT(*) as total_records,
      DATE(timestamp) as date,
      COUNT(*) as daily_count
    FROM received_data 
    GROUP BY DATE(timestamp)
    ORDER BY date DESC
    LIMIT 30
  `, (err, dailyStats) => {
    if (err) {
      console.error('Error al obtener estadísticas:', err.message);
      return res.status(500).json({
        error: 'Error al obtener estadísticas'
      });
    }
    
    db.get(`SELECT COUNT(*) as total FROM received_data`, (err, totalResult) => {
      if (err) {
        console.error('Error al obtener total:', err.message);
        return res.status(500).json({
          error: 'Error al obtener estadísticas'
        });
      }
      
      res.json({
        total_records: totalResult.total,
        daily_stats: dailyStats
      });
    });
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
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor Express corriendo en http://localhost:${PORT}`);
  console.log(`📊 Health check disponible en http://localhost:${PORT}/health`);
  console.log(`📋 API endpoints disponibles:`);
  console.log(`   POST /api/data - Guardar datos`);
  console.log(`   GET  /api/data - Ver todos los datos (con paginación)`);
  console.log(`   GET  /api/data/:id - Ver dato específico`);
  console.log(`   DELETE /api/data/:id - Eliminar dato específico`);
  console.log(`   GET  /api/stats - Ver estadísticas`);
});

// Cerrar la base de datos cuando el proceso termine
process.on('SIGINT', () => {
  console.log('\n🔄 Cerrando servidor...');
  db.close((err) => {
    if (err) {
      console.error('Error al cerrar la base de datos:', err.message);
    } else {
      console.log('📁 Base de datos cerrada correctamente');
    }
    server.close(() => {
      console.log('🛑 Servidor cerrado');
      process.exit(0);
    });
  });
});

module.exports = app;