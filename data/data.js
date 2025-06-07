// data/data.js

// Colección: Recintos
export const recintosData = [
  {
    "_id": "R001", // Simulado como string para frontend
    "nombre": "Colegio Nacional Florida",
    "direccion": "Calle Ayacucho s/n, Zona Central",
    "circunscripcion_id": "C1",
    "ubicacion_geojson": {
      "type": "Point",
      "coordinates": [-63.1818, -17.7850]
    },
    "numero_mesas": 15,
    "jefe_recinto_id": "U005", // Referencia al usuario jefe de recinto
    "delegados_requeridos": 15, // 1 delegado por mesa
    "delegados_asignados": 0 // Actualizado dinámicamente
  },
  {
    "_id": "R002", // Simulado como string para frontend
    "nombre": "Unidad Educativa Santa Ana",
    "direccion": "Av. Brasil 345, Barrio Hamacas",
    "circunscripcion_id": "C2",
    "numero_mesas": 5,
    "delegados_asignados": 5, // Simulación: 100% de cobertura
    "ubicacion_geojson": {
        "type": "Point",
        "coordinates": 
            [-63.1700, -17.7900]
        
    }
  },
  {
    "_id": "R003", // Simulado como string para frontend
    "nombre": "Colegio Don Bosco",
    "direccion": "Av. Omar Chávez 500, Casco Viejo",
    "circunscripcion_id": "C1",
    "numero_mesas": 8,
    "delegados_asignados": 3, // Simulación: cobertura parcial
    "ubicacion_geojson": {
        "type": "Point",
        "coordinates": [-63.2000, -17.7700]
    }
  },
  {
    "_id": "R004", // Simulado como string para frontend
    "nombre": "Universidad Privada de Santa Cruz (UPSA)",
    "direccion": "Km 6.5 Doble Vía a La Guardia",
    "circunscripcion_id": "C3",
    "numero_mesas": 20,
    "delegados_asignados": 20, // Simulación: 100% de cobertura
    "ubicacion_geojson": {
        "type": "Point",
        "coordinates": [-63.1450, -17.7550]
    }
  },
  {
    "_id": "R005", // Simulado como string para frontend
    "nombre": "Colegio Americano",
    "direccion": "Av. San Martín 200, Equipetrol",
    "circunscripcion_id": "C1",
    "numero_mesas": 12,
    "delegados_asignados": 10, // Simulación: cobertura parcial
    "ubicacion_geojson": {
        "type": "Point",
        "coordinates": [-63.1880, -17.7650]
    }
  },
  {
    "_id": "R006", // Simulado como string para frontend
    "nombre": "Liceo Militar Gualberto Villarroel",
    "direccion": "Av. Paurito s/n, Villa Primero de Mayo",
    "circunscripcion_id": "C4",
    "numero_mesas": 25,
    "delegados_asignados": 0, // Simulación: 0% de cobertura
    "ubicacion_geojson": {
        "type": "Point",
        "coordinates": [-63.1200, -17.7400]
    }
  },
  {
    "_id": "R007", // Simulado como string para frontend
    "nombre": "Colegio Alemán",
    "direccion": "Av. La Barranca 200, Las Palmas",
    "circunscripcion_id": "C3",
    "numero_mesas": 7,
    "delegados_asignados": 7, // Simulación: 100% de cobertura
    "ubicacion_geojson": {
        "type": "Point",
        "coordinates": 
            [-63.1900, -17.7500]
        
    }
  }
];

// Colección: Usuarios
export const usuariosData = [
  {
    "_id": "U001", // Simulado como string para frontend
    "nombre": "Juan",
    "apellido": "Pérez",
    "ci": "1234567SC",
    "telefono": "70012345",
    "email": "juan.perez@example.com",
    "password_hash": "hashed_password_here",
    "rol": "admin"
  },
  {
    "_id": "U002", // Simulado como string para frontend
    "nombre": "Maria",
    "apellido": "Gonzales",
    "ci": "9876543SC",
    "telefono": "71122334",
    "email": "maria.gonzales@example.com",
    "password_hash": "hashed_password_here",
    "rol": "candidato_circunscripcion",
    "circunscripcion_id": "C1"
  },
  {
    "_id": "U003", // Simulado como string para frontend
    "nombre": "Carlos",
    "apellido": "Rodriguez",
    "ci": "1122334SC",
    "telefono": "69988776",
    "email": "carlos.rodriguez@example.com",
    "password_hash": "hashed_password_here",
    "rol": "delegado",
    "recinto_asignado_id": "R001",
    "mesa_asignada_numero": 5
  },
  {
    "_id": "U004", // Simulado como string para frontend
    "nombre": "Ana",
    "apellido": "Mamani",
    "ci": "2233445SC",
    "telefono": "67766554",
    "email": "ana.mamani@example.com",
    "password_hash": "hashed_password_here",
    "rol": "dirigente",
    "circunscripcion_id": "C1",
    "barrio_id": "B001"
  },
  {
    "_id": "U005", // Simulado como string para frontend
    "nombre": "Pedro",
    "apellido": "Solis",
    "ci": "3344556SC",
    "telefono": "78899001",
    "email": "pedro.solis@example.com",
    "password_hash": "hashed_password_here",
    "rol": "jefe_recinto",
    "recinto_asignado_id": "R001"
  },
  {
    "_id": "U006", // Simulado como string para frontend
    "nombre": "Laura",
    "apellido": "Paz",
    "ci": "4455667SC",
    "telefono": "77788990",
    "email": "laura.paz@example.com",
    "password_hash": "hashed_password_here",
    "rol": "delegado",
    "recinto_asignado_id": "R003",
    "mesa_asignada_numero": 1
  },
  {
    "_id": "U007", // Simulado como string para frontend
    "nombre": "Roberto",
    "apellido": "Vargas",
    "ci": "5566778SC",
    "telefono": "76543210",
    "email": "roberto.vargas@example.com",
    "password_hash": "hashed_password_here",
    "rol": "delegado",
    "recinto_asignado_id": "R001",
    "mesa_asignada_numero": 2
  },
  {
    "_id": "U008", // Simulado como string para frontend
    "nombre": "Sofia",
    "apellido": "Quispe",
    "ci": "6677889SC",
    "telefono": "61234567",
    "email": "sofia.quispe@example.com",
    "password_hash": "hashed_password_here",
    "rol": "candidato_circunscripcion",
    "circunscripcion_id": "C2"
  },
  {
    "_id": "U009", // Simulado como string para frontend
    "nombre": "Fernando",
    "apellido": "Tapia",
    "ci": "7788990SC",
    "telefono": "79012345",
    "email": "fernando.tapia@example.com",
    "password_hash": "hashed_password_here",
    "rol": "jefe_recinto",
    "recinto_asignado_id": "R002"
  },
  {
    "_id": "U010", // Simulado como string para frontend
    "nombre": "Gabriela",
    "apellido": "Mendoza",
    "ci": "8899001SC",
    "telefono": "68765432",
    "email": "gabriela.mendoza@example.com",
    "password_hash": "hashed_password_here",
    "rol": "delegado",
    "recinto_asignado_id": "R002",
    "mesa_asignada_numero": 1
  },
  {
    "_id": "U011", // Simulado como string para frontend
    "nombre": "Miguel",
    "apellido": "Choque",
    "ci": "9900112SC",
    "telefono": "75432109",
    "email": "miguel.choque@example.com",
    "password_hash": "hashed_password_here",
    "rol": "delegado",
    "recinto_asignado_id": "R002",
    "mesa_asignada_numero": 2
  },
  {
    "_id": "U012", // Simulado como string para frontend
    "nombre": "Andrea",
    "apellido": "Pinto",
    "ci": "1011223SC",
    "telefono": "70001122",
    "email": "andrea.pinto@example.com",
    "password_hash": "hashed_password_here",
    "rol": "delegado",
    "recinto_asignado_id": "R001",
    "mesa_asignada_numero": 3
  }
];

// Colección: Dirigentes
export const dirigentesData = [
  {
    "_id": "D001", // Simulado como string para frontend
    "nombre": "Ricardo",
    "apellido": "Flores",
    "ci": "4455667SC",
    "telefono": "75544332",
    "email": "ricardo.flores@example.com",
    "circunscripcion_id": "C1",
    "barrio_id": "B001"
  },
  {
    "_id": "D002", // Simulado como string para frontend
    "nombre": "Carla",
    "apellido": "Coca",
    "ci": "3322110SC",
    "telefono": "60987654",
    "email": "carla.coca@example.com",
    "circunscripcion_id": "C2",
    "barrio_id": "B002"
  },
  {
    "_id": "D003", // Simulado como string para frontend
    "nombre": "Luis",
    "apellido": "Rojas",
    "ci": "9988776SC",
    "telefono": "71020304",
    "email": "luis.rojas@example.com",
    "circunscripcion_id": "C1",
    "barrio_id": "B001"
  }
];

// Colección: Barrios
export const barriosData = [
  {
    "_id": "B001", // Simulado como string para frontend
    "nombre": "Barrio Equipetrol Norte",
    "circunscripcion_id": "C1",
    "ubicacion_geojson": {
        "type": "Polygon",
        "coordinates": [[
            [-63.1950, -17.7800],
            [-63.1900, -17.7750],
            [-63.1850, -17.7750],
            [-63.1800, -17.7800],
            [-63.1800, -17.7850],
            [-63.1850, -17.7900],
            [-63.1900, -17.7900],
            [-63.1950, -17.7800]
        ]]
    }
  },
  {
    "_id": "B002", // Simulado como string para frontend
    "nombre": "Barrio Hamacas",
    "circunscripcion_id": "C2",
    "ubicacion_geojson": {
        "type": "Polygon",
        "coordinates": [[
            [-63.1500, -17.7600],
            [-63.1400, -17.7600],
            [-63.1400, -17.7700],
            [-63.1500, -17.7700],
            [-63.1500, -17.7600]
        ]]
    }
  },
  {
    "_id": "B003", // Simulado como string para frontend
    "nombre": "Zona Sur",
    "circunscripcion_id": "C3",
    "ubicacion_geojson": {
        "type": "Polygon",
        "coordinates": [[
            [-63.2200, -17.8200],
            [-63.2100, -17.8200],
            [-63.2100, -17.8300],
            [-63.2200, -17.8300],
            [-63.2200, -17.8200]
        ]]
    }
  }
];

// Colección: Actas
export const actasData = [
  {
    "_id": "A001", // Simulado como string para frontend
    "delegado_id": "U003",
    "recinto_id": "R001",
    "mesa_numero": 5,
    "url_foto_acta": "https://placehold.co/600x400", // URL de placeholder
    "fecha_hora_subida": "2025-06-07T10:30:00Z",
    "estado_revision": "aprobado"
  },
  {
    "_id": "A002", // Simulado como string para frontend
    "delegado_id": "U006",
    "recinto_id": "R003",
    "mesa_numero": 1,
    "url_foto_acta": "https://placehold.co/600x400", // URL de placeholder
    "fecha_hora_subida": "2025-06-07T11:00:00Z",
    "estado_revision": "pendiente"
  },
  {
    "_id": "A003", // Simulado como string para frontend
    "delegado_id": "U010",
    "recinto_id": "R002",
    "mesa_numero": 1,
    "url_foto_acta": "https://placehold.co/600x400", // URL de placeholder
    "fecha_hora_subida": "2025-06-07T11:15:00Z",
    "estado_revision": "pendiente"
  },
  {
    "_id": "A004", // Simulado como string para frontend
    "delegado_id": "U011",
    "recinto_id": "R002",
    "mesa_numero": 2,
    "url_foto_acta": "https://placehold.co/600x400", // URL de placeholder
    "fecha_hora_subida": "2025-06-07T11:45:00Z",
    "estado_revision": "problema" // Simula un acta con problemas
  }
];