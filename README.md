# Server Hooks con SQLite

Un servidor Express con base de datos SQLite para recibir, almacenar y consultar datos.

## 🚀 Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar en producción
npm start
```

## 📊 API Endpoints

### POST /api/data
Guarda datos en la base de datos SQLite.

**Ejemplo de request:**
```bash
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Juan", "edad": 30, "ciudad": "Madrid"}'
```

**Respuesta:**
```json
{
  "message": "Datos recibidos y guardados correctamente",
  "id": 1,
  "data": {
    "nombre": "Juan",
    "edad": 30,
    "ciudad": "Madrid"
  },
  "saved_at": "2025-08-18T10:30:00.000Z"
}
```

### GET /api/data
Obtiene todos los datos guardados con paginación.

**Parámetros de query:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10)

**Ejemplo:**
```bash
curl http://localhost:3000/api/data?page=1&limit=5
```

**Respuesta:**
```json
{
  "data": [
    {
      "id": 1,
      "data": {"nombre": "Juan", "edad": 30},
      "timestamp": "2025-08-18 10:30:00",
      "ip_address": "::1",
      "user_agent": "curl/7.68.0"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 1,
    "totalPages": 1
  }
}
```

### GET /api/data/:id
Obtiene un dato específico por su ID.

**Ejemplo:**
```bash
curl http://localhost:3000/api/data/1
```

### DELETE /api/data/:id
Elimina un dato específico por su ID.

**Ejemplo:**
```bash
curl -X DELETE http://localhost:3000/api/data/1
```

### GET /api/stats
Obtiene estadísticas de los datos almacenados.

**Ejemplo:**
```bash
curl http://localhost:3000/api/stats
```

**Respuesta:**
```json
{
  "total_records": 10,
  "daily_stats": [
    {
      "total_records": 5,
      "date": "2025-08-18",
      "daily_count": 5
    }
  ]
}
```

## 🗄️ Base de datos

El servidor crea automáticamente una base de datos SQLite (`data.db`) con la siguiente estructura:

```sql
CREATE TABLE received_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT
);
```

## 🔧 Características

- ✅ Base de datos SQLite integrada
- ✅ Paginación en consultas
- ✅ Registro de IP y User-Agent
- ✅ Manejo de errores robusto
- ✅ CORS habilitado
- ✅ Estadísticas de uso
- ✅ Cierre limpio de la base de datos

## 📝 Logs

El servidor registra automáticamente:
- Conexión a la base de datos
- Datos recibidos en cada POST
- Errores de base de datos
- Estadísticas de uso
