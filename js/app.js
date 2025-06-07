// app.js

// Importar los datos desde el archivo data/data.js
import { recintosData, usuariosData, dirigentesData, barriosData, actasData } from '../data/data.js'; // Ajusta la ruta si es necesario

// Variable global para el mapa
let mymap;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar el mapa
    mymap = L.map('mapid').setView([-17.7833, -63.1822], 13); // Coordenadas de Santa Cruz

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mymap);

    loadRecintos(); // Cargar los recintos al inicio

    // Manejo de la navegación
    document.getElementById('nav-mapa').addEventListener('click', () => showSection('mapa-container'));
    document.getElementById('nav-delegados').addEventListener('click', () => showSection('delegados-container'));
    document.getElementById('nav-dirigentes').addEventListener('click', () => showSection('dirigentes-container'));
    document.getElementById('nav-actas').addEventListener('click', () => showSection('actas-container'));
    // document.getElementById('logout-btn').addEventListener('click', () => alert('Cerrar sesión (implementar lógica de autenticación)'));

    // --- Lógica del selector de rol ---
    const roleSelect = document.getElementById('role-select');
    const applyRoleBtn = document.getElementById('apply-role-btn');

    // Función para aplicar el rol seleccionado
    const applySelectedRole = () => {
        const selectedValue = roleSelect.value;
        let currentUserRole;
        let currentUserCircunscripcionId = null;
        let currentUserRecintoId = null;

        // Parsear el valor seleccionado para extraer rol y IDs si es necesario
        if (selectedValue.includes('_C')) {
            currentUserRole = selectedValue.split('_')[0];
            currentUserCircunscripcionId = selectedValue.split('_')[1];
        } else if (selectedValue.includes('_R')) {
            currentUserRole = selectedValue.split('_')[0];
            currentUserRecintoId = selectedValue.split('_')[1];
            // Para delegado, si está asignado a un recinto, también podemos obtener la circunscripción de ese recinto
            currentUserCircunscripcionId = recintosData.find(r => r._id === currentUserRecintoId)?.circunscripcion_id || null;
        } else {
            currentUserRole = selectedValue;
        }

        // Actualizar la UI según el rol
        updateUIByRole(currentUserRole);

        // Limpiar contenido de dashboards antes de mostrar nueva información
        document.getElementById('delegados-dashboard').innerHTML = '';
        document.getElementById('dirigentes-list').innerHTML = '';
        document.getElementById('actas-upload-view').innerHTML = '';
        document.getElementById('actas-review-view').innerHTML = '';

        // Mostrar información específica del rol
        if (currentUserRole === 'candidato_circunscripcion') {
            displayCandidatoInfo(currentUserCircunscripcionId);
        } else if (currentUserRole === 'jefe_recinto') {
            displayJefeRecintoInfo(currentUserRecintoId);
        } else if (currentUserRole === 'delegado') {
            // Para el delegado, buscamos su asignación real en los usuariosData
            const delegadoTest = usuariosData.find(u => u.rol === 'delegado' && u.recinto_asignado_id === currentUserRecintoId);
            if (delegadoTest) {
                displayDelegadoInfo(delegadoTest.recinto_asignado_id);
            } else {
                // Si no se encuentra una asignación específica, usar la primera del R001 por defecto para la demo
                const defaultDelegado = usuariosData.find(u => u.rol === 'delegado' && u.recinto_asignado_id === 'R001');
                if (defaultDelegado) {
                    displayDelegadoInfo(defaultDelegado.recinto_asignado_id);
                } else {
                    document.getElementById('actas-upload-view').innerHTML = `<p>No hay un delegado de prueba asignado para mostrar.</p>`;
                }
            }
        } else if (currentUserRole === 'dirigente') {
            displayDirigenteInfo(currentUserCircunscripcionId);
        }

        // Mostrar el mapa por defecto al cambiar de rol para que se vea la diferencia
        showSection('mapa-container');
    };

    // Aplica el rol inicial al cargar la página
    applySelectedRole();

    // Añade el event listener al botón de aplicar rol
    applyRoleBtn.addEventListener('click', applySelectedRole);
});

function showSection(sectionId) {
    document.querySelectorAll('main section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
    if (sectionId === 'mapa-container' && mymap) {
        mymap.invalidateSize();
    }
}

async function loadRecintos() {
    const delegadosPorMesa = 1;

    mymap.eachLayer(function (layer) {
        if (layer instanceof L.GeoJSON) {
            mymap.removeLayer(layer);
        }
    });

    recintosData.forEach(recinto => {
        if (!recinto.numero_mesas) {
            console.warn(`Recinto ${recinto._id || recinto.id} no tiene numero_mesas. Asumiendo 1 mesa.`);
            recinto.numero_mesas = 1;
        }

        const requiredDelegates = recinto.numero_mesas * delegadosPorMesa;
        
        let fillColor;
        if (recinto.delegados_asignados >= requiredDelegates) {
            fillColor = '#28a745';
        } else if (recinto.delegados_asignados > 0) {
            fillColor = '#ffc107';
        } else {
            fillColor = '#dc3545';
        }

        const geojsonFeature = {
            "type": "Feature",
            "properties": {
                "id": recinto._id || recinto.id, // Usa _id o id
                "name": recinto.nombre,
                "mesas": recinto.numero_mesas,
                "delegados_requeridos": requiredDelegates,
                "delegados_asignados": recinto.delegados_asignados,
                "cobertura": (recinto.delegados_asignados / requiredDelegates * 100).toFixed(0) + '%'
            },
            "geometry": recinto.ubicacion_geojson
        };

        L.geoJson(geojsonFeature, {
            style: function(feature) {
                if (feature.geometry.type === 'Polygon') {
                    return {
                        fillColor: fillColor,
                        color: '#333',
                        weight: 2,
                        opacity: 0.8,
                        fillOpacity: 0.5
                    };
                }
                return {};
            },
            pointToLayer: function (feature, latlng) {
                if (feature.geometry.type === 'Point') {
                    const iconHtml = `<div style="background-color: ${fillColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #333;"></div>`;
                    return L.marker(latlng, {
                        icon: L.divIcon({
                            className: 'custom-div-icon',
                            html: iconHtml,
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                        })
                    });
                }
                return null;
            },
            onEachFeature: function(feature, layer) {
                if (feature.properties && feature.properties.name) {
                    layer.bindPopup(`
                        <b>${feature.properties.name}</b><br>
                        Mesas: ${feature.properties.mesas}<br>
                        Delegados Requeridos: ${feature.properties.delegados_requeridos}<br>
                        Delegados Asignados: ${feature.properties.delegados_asignados}<br>
                        Cobertura: ${feature.properties.cobertura}
                    `);
                }
            }
        }).addTo(mymap);
    });

    barriosData.forEach(barrio => {
        if (barrio.ubicacion_geojson && barrio.ubicacion_geojson.type === 'Polygon') {
            L.geoJson(barrio.ubicacion_geojson, {
                style: {
                    fillColor: '#add8e6',
                    color: '#0056b3',
                    weight: 1,
                    opacity: 0.5,
                    fillOpacity: 0.2
                },
                onEachFeature: function(feature, layer) {
                    if (barrio.nombre) {
                        layer.bindPopup(`<b>Barrio: ${barrio.nombre}</b><br>Circunscripción: ${barrio.circunscripcion_id}`);
                    }
                }
            }).addTo(mymap);
        }
    });
}

function updateUIByRole(role) {
    const navDelegados = document.getElementById('nav-delegados');
    const navDirigentes = document.getElementById('nav-dirigentes');
    const navActas = document.getElementById('nav-actas');
    const navMapa = document.getElementById('nav-mapa');

    document.querySelectorAll('main section').forEach(section => {
        section.classList.add('hidden');
    });

    navMapa.classList.remove('hidden');
    document.getElementById('mapa-container').classList.remove('hidden');

    navDelegados.classList.add('hidden');
    navDirigentes.classList.add('hidden');
    navActas.classList.add('hidden');

    // Desactivar todas las pestañas de navegación para empezar
    document.querySelectorAll('nav a').forEach(link => {
        link.style.pointerEvents = 'none'; // Deshabilita clics
        link.style.opacity = '0.5'; // Apariencia de deshabilitado
    });


    switch (role) {
        case 'admin':
            navDelegados.classList.remove('hidden');
            navDirigentes.classList.remove('hidden');
            navActas.classList.remove('hidden');
            // Habilitar todas las pestañas
            document.querySelectorAll('nav a').forEach(link => {
                link.style.pointerEvents = 'auto';
                link.style.opacity = '1';
            });
            break;
        case 'candidato_circunscripcion':
            navDelegados.classList.remove('hidden');
            navActas.classList.remove('hidden');
            // Habilitar pestañas específicas
            document.getElementById('nav-mapa').style.pointerEvents = 'auto';
            document.getElementById('nav-mapa').style.opacity = '1';
            document.getElementById('nav-delegados').style.pointerEvents = 'auto';
            document.getElementById('nav-delegados').style.opacity = '1';
            document.getElementById('nav-actas').style.pointerEvents = 'auto';
            document.getElementById('nav-actas').style.opacity = '1';
            break;
        case 'jefe_recinto':
            navDelegados.classList.remove('hidden');
            navActas.classList.remove('hidden');
            // Habilitar pestañas específicas
            document.getElementById('nav-mapa').style.pointerEvents = 'auto';
            document.getElementById('nav-mapa').style.opacity = '1';
            document.getElementById('nav-delegados').style.pointerEvents = 'auto';
            document.getElementById('nav-delegados').style.opacity = '1';
            document.getElementById('nav-actas').style.pointerEvents = 'auto';
            document.getElementById('nav-actas').style.opacity = '1';
            break;
        case 'delegado':
            navActas.classList.remove('hidden');
            // Habilitar pestañas específicas
            document.getElementById('nav-actas').style.pointerEvents = 'auto';
            document.getElementById('nav-actas').style.opacity = '1';
            document.getElementById('nav-mapa').style.pointerEvents = 'auto'; // Los delegados pueden ver el mapa
            document.getElementById('nav-mapa').style.opacity = '1';
            break;
        case 'dirigente':
            // Dirigentes solo tienen acceso al mapa y quizás a la vista de Dirigentes
            navDirigentes.classList.remove('hidden');
            document.getElementById('nav-mapa').style.pointerEvents = 'auto';
            document.getElementById('nav-mapa').style.opacity = '1';
            document.getElementById('nav-dirigentes').style.pointerEvents = 'auto';
            document.getElementById('nav-dirigentes').style.opacity = '1';
            break;
        default:
            break;
    }
}

// --- Funciones para mostrar información específica por rol (simuladas) ---

function displayCandidatoInfo(circunscripcionId) {
    const delegadosDashboard = document.getElementById('delegados-dashboard');
    delegadosDashboard.innerHTML = `<h3>Información de Candidato - Circunscripción ${circunscripcionId}</h3>`;

    // Filtra los recintos por la circunscripción del candidato
    const recintosEnCircunscripcion = recintosData.filter(r => r.circunscripcion_id === circunscripcionId);
    let totalMesas = 0;
    let totalDelegadosRequeridos = 0;
    let totalDelegadosAsignados = 0;

    if (recintosEnCircunscripcion.length > 0) {
        recintosEnCircunscripcion.forEach(recinto => {
            const requiredDelegates = recinto.numero_mesas; // Asumimos 1 delegado por mesa
            const assignedDelegates = usuariosData.filter(u => u.rol === 'delegado' && u.recinto_asignado_id === (recinto._id || recinto.id)).length;

            totalMesas += recinto.numero_mesas;
            totalDelegadosRequeridos += requiredDelegates;
            totalDelegadosAsignados += assignedDelegates;

            delegadosDashboard.innerHTML += `
                <p><b>Recinto: ${recinto.nombre}</b> (Mesas: ${recinto.numero_mesas})<br>
                Necesita: ${requiredDelegates} delegados. Asignados: ${assignedDelegates}.</p>
            `;
        });

        const coberturaPorcentaje = totalDelegadosRequeridos > 0 ? ((totalDelegadosAsignados / totalDelegadosRequeridos) * 100).toFixed(2) : 0;

        delegadosDashboard.innerHTML += `
            <p><strong>Resumen Circunscripción ${circunscripcionId}:</strong></p>
            <p>Total Recintos: ${recintosEnCircunscripcion.length}</p>
            <p>Total Mesas: ${totalMesas}</p>
            <p>Total Delegados Requeridos: ${totalDelegadosRequeridos}</p>
            <p>Total Delegados Asignados: ${totalDelegadosAsignados}</p>
            <p>Porcentaje de Cobertura: ${coberturaPorcentaje}%</p>
        `;

        // También mostrar actas para la circunscripción
        const actasReviewView = document.getElementById('actas-review-view');
        actasReviewView.innerHTML = `<h4>Actas Subidas en Circunscripción ${circunscripcionId}</h4>`;
        const actasEnCircunscripcion = actasData.filter(acta => 
            recintosEnCircunscripcion.some(recinto => (recinto._id || recinto.id) === acta.recinto_id)
        );

        if (actasEnCircunscripcion.length > 0) {
            actasReviewView.innerHTML += `<ul>
                ${actasEnCircunscripcion.map(acta => {
                    const recinto = recintosData.find(r => (r._id || r.id) === acta.recinto_id);
                    const delegado = usuariosData.find(u => u._id === acta.delegado_id);
                    return `<li><b>Recinto: ${recinto?.nombre || 'N/A'}</b>, Mesa ${acta.mesa_numero}: <a href="${acta.url_foto_acta}" target="_blank">Ver Acta</a> (Estado: ${acta.estado_revision}) - Subida por: ${delegado?.nombre || 'N/A'} ${delegado?.apellido || ''}</li>`;
                }).join('')}
            </ul>`;
        } else {
            actasReviewView.innerHTML += `<p>No hay actas subidas para esta circunscripción.</p>`;
        }
    } else {
        delegadosDashboard.innerHTML += `<p>No hay recintos asignados a la circunscripción ${circunscripcionId} o los datos no están disponibles.</p>`;
        document.getElementById('actas-review-view').innerHTML = `<p>No hay actas para esta circunscripción.</p>`;
    }
}

function displayJefeRecintoInfo(recintoId) {
    const delegadosDashboard = document.getElementById('delegados-dashboard');
    delegadosDashboard.innerHTML = `<h3>Información de Jefe de Recinto</h3>`;

    const recintoAsignado = recintosData.find(r => (r._id || r.id) === recintoId);
    if (recintoAsignado) {
        const delegadosRecinto = usuariosData.filter(u => u.rol === 'delegado' && u.recinto_asignado_id === (recintoAsignado._id || recintoAsignado.id));
        delegadosDashboard.innerHTML += `
            <h4>Recinto Asignado: ${recintoAsignado.nombre}</h4>
            <p>Dirección: ${recintoAsignado.direccion || 'N/A'}</p>
            <p>Mesas: ${recintoAsignado.numero_mesas}</p>
            <p>Delegados Requeridos: ${recintoAsignado.delegados_requeridos}</p>
            <p>Delegados Asignados: ${delegadosRecinto.length}</p>
            <h5>Delegados de su Recinto:</h5>
            <ul>
                ${delegadosRecinto.map(d => `<li>${d.nombre} ${d.apellido} (Mesa ${d.mesa_asignada_numero})</li>`).join('')}
            </ul>
            <button onclick="alert('Funcionalidad para asignar/gestionar delegados.')">Gestionar Delegados</button>
        `;
    } else {
        delegadosDashboard.innerHTML += `<p>No tiene un recinto asignado o el recinto no fue encontrado (ID: ${recintoId}).</p>`;
    }

    const actasReviewView = document.getElementById('actas-review-view');
    actasReviewView.innerHTML = `<h4>Actas Subidas en Recinto ${recintoAsignado ? recintoAsignado.nombre : 'N/A'}</h4>`;
    const actasRecinto = actasData.filter(a => a.recinto_id === (recintoAsignado?._id || recintoAsignado?.id));
    if (actasRecinto.length > 0) {
        actasReviewView.innerHTML += `<ul>
            ${actasRecinto.map(acta => {
                const delegado = usuariosData.find(u => u._id === acta.delegado_id);
                return `<li>Mesa ${acta.mesa_numero}: <a href="${acta.url_foto_acta}" target="_blank">Ver Acta</a> (Estado: ${acta.estado_revision}) - Subida por: ${delegado?.nombre || 'N/A'} ${delegado?.apellido || ''}</li>`;
            }).join('')}
        </ul>`;
    } else {
        actasReviewView.innerHTML += `<p>No hay actas subidas para este recinto.</p>`;
    }
}

function displayDelegadoInfo(recintoId) { // Eliminamos circunscripcionId ya que el delegado se enfoca en su recinto/mesa
    const actasUploadView = document.getElementById('actas-upload-view');
    actasUploadView.innerHTML = `<h3>Subir Acta Electoral</h3>`;

    // Intentamos encontrar al delegado en los datos globales para obtener su mesa_asignada_numero
    // Si no se encuentra un delegado específico para este recintoId, podríamos usar el primero encontrado o mostrar un mensaje.
    const delegadoActual = usuariosData.find(u => u.rol === 'delegado' && u.recinto_asignado_id === recintoId);
    
    if (delegadoActual) {
        actasUploadView.innerHTML += `
            <p>Asignado a: <b>${recintosData.find(r => (r._id || r.id) === recintoId)?.nombre || 'Recinto Desconocido'}</b>, Mesa: <b>${delegadoActual.mesa_asignada_numero}</b></p>
            <input type="file" id="actaFileInput" accept="image/*"><br><br>
            <!-- <button onclick="handleActaUpload('${delegadoActual._id}', '${recintoId}', ${delegadoActual.mesa_asignada_numero})">Subir Acta</button> -->
            <button onclick="alert('Todavia no se puede subir fotos')">Subir Acta</button>
            <p id="uploadMessage"></p>
        `;
    } else {
        actasUploadView.innerHTML = `<p>Actualmente, no está asignado a un recinto o mesa específica en nuestros datos de prueba.</p>
                                     <p>Intente seleccionar un rol de delegado con un recinto asignado como "Delegado (R001, Mesa 5)" o "Delegado (R003, Mesa 1)".</p>`;
    }
}

function handleActaUpload(delegadoId, recintoId, mesaNumero) {
    const fileInput = document.getElementById('actaFileInput');
    const uploadMessage = document.getElementById('uploadMessage');
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        
        // Simular una URL de archivo subido
        const simulatedUrl = `https://via.placeholder.com/200/FFD700/000000?text=Acta_${recintoId}_M${mesaNumero}_${Date.now()}`;
        
        // Simular añadir a `actasData` (solo para el demo en frontend)
        actasData.push({
            "_id": `A${Date.now()}`, // ID simulado único
            "delegado_id": delegadoId,
            "recinto_id": recintoId,
            "mesa_numero": mesaNumero,
            "url_foto_acta": simulatedUrl,
            "fecha_hora_subida": new Date().toISOString(),
            "estado_revision": "pendiente"
        });
        
        uploadMessage.textContent = `Acta de Mesa ${mesaNumero} subida exitosamente! (URL: ${simulatedUrl})`;
        uploadMessage.style.color = 'green';
        console.log('Acta subida simulada:', actasData[actasData.length - 1]);

        // Opcional: Actualizar la vista de revisión si el rol actual lo permite
        const currentUserRole = document.getElementById('role-select').value.split('_')[0];
        if (currentUserRole === 'jefe_recinto') {
            displayJefeRecintoInfo(recintoId); // Recargar la info del jefe de recinto para ver la nueva acta
        } else if (currentUserRole === 'candidato_circunscripcion') {
            // Encuentra la circunscripción del recinto y recarga la info del candidato
            const recinto = recintosData.find(r => (r._id || r.id) === recintoId);
            if (recinto) displayCandidatoInfo(recinto.circunscripcion_id);
        }

    } else {
        uploadMessage.textContent = 'Por favor, selecciona un archivo de imagen.';
        uploadMessage.style.color = 'red';
    }
}

function displayDirigenteInfo(circunscripcionId) {
    const dirigentesList = document.getElementById('dirigentes-list');
    dirigentesList.innerHTML = `<h3>Información de Dirigentes - Circunscripción ${circunscripcionId}</h3>`;

    const dirigentesEnCircunscripcion = dirigentesData.filter(d => d.circunscripcion_id === circunscripcionId);
    if (dirigentesEnCircunscripcion.length > 0) {
        dirigentesList.innerHTML += `<ul>
            ${dirigentesEnCircunscripcion.map(d => `<li>${d.nombre} ${d.apellido} (Tel: ${d.telefono}, Barrio: ${barriosData.find(b => b._id === d.barrio_id)?.nombre || 'N/A'})</li>`).join('')}
        </ul>`;
    } else {
        dirigentesList.innerHTML += `<p>No hay dirigentes registrados para esta circunscripción.</p>`;
    }
    
    // También podrías mostrar un resumen de la cobertura de delegados para su circunscripción y barrios
    // Este código es similar al de displayCandidatoInfo, pero lo incluimos aquí para el rol de dirigente.
    const recintosEnCircunscripcion = recintosData.filter(r => r.circunscripcion_id === circunscripcionId);
    let totalMesas = 0;
    let totalDelegadosRequeridos = 0;
    let totalDelegadosAsignados = 0;

    recintosEnCircunscripcion.forEach(recinto => {
        const requiredDelegates = recinto.numero_mesas; // Asumimos 1 delegado por mesa
        const assignedDelegates = usuariosData.filter(u => u.rol === 'delegado' && u.recinto_asignado_id === (recinto._id || recinto.id)).length;

        totalMesas += recinto.numero_mesas;
        totalDelegadosRequeridos += requiredDelegates;
        totalDelegadosAsignados += assignedDelegates;
    });

    const coberturaPorcentaje = totalDelegadosRequeridos > 0 ? ((totalDelegadosAsignados / totalDelegadosRequeridos) * 100).toFixed(2) : 0;

    dirigentesList.innerHTML += `
        <h4>Resumen de Cobertura en Circunscripción ${circunscripcionId}:</h4>
        <p>Total Recintos: ${recintosEnCircunscripcion.length}</p>
        <p>Total Mesas: ${totalMesas}</p>
        <p>Total Delegados Requeridos: ${totalDelegadosRequeridos}</p>
        <p>Total Delegados Asignados: ${totalDelegadosAsignados}</p>
        <p>Porcentaje de Cobertura: ${coberturaPorcentaje}%</p>
    `;
}