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

    // Call loadRecintos with initial role (derived from the selected option)
    const initialRoleSelect = document.getElementById('role-select');
    const initialSelectedOption = initialRoleSelect.options[initialRoleSelect.selectedIndex];
    const initialRole = initialSelectedOption.value;
    const initialCircunscripcionId = initialSelectedOption.dataset.circunscripcionId || null;
    const initialRecintoId = initialSelectedOption.dataset.recintoId || null;

    // Handle initial circunscripcion for a precinct if not explicitly set
    let effectiveInitialCircunscripcionId = initialCircunscripcionId;
    if (initialRecintoId && !effectiveInitialCircunscripcionId) {
        effectiveInitialCircunscripcionId = recintosData.find(r => r._id === initialRecintoId)?.circunscripcion_id || null;
    }
    
    // Call loadRecintos with the determined initial parameters
    loadRecintos(initialRole, effectiveInitialCircunscripcionId, initialRecintoId); 

    // Manejo de la navegación
    document.getElementById('nav-mapa').addEventListener('click', () => showSection('mapa-container'));
    document.getElementById('nav-delegados').addEventListener('click', () => showSection('delegados-container'));
    document.getElementById('nav-dirigentes').addEventListener('click', () => showSection('dirigentes-container'));
    document.getElementById('nav-actas').addEventListener('click', () => showSection('actas-container'));
    // document.getElementById('logout-btn').addEventListener('click', () => alert('Cerrar sesión (implementar lógica de autenticación)'));

    // --- Lógica del selector de rol ---
    const roleSelect = document.getElementById('role-select');
    const applyRoleBtn = document.getElementById('apply-role-btn');

    const applySelectedRole = () => {
        const selectedOption = roleSelect.options[roleSelect.selectedIndex];
        const currentUserRole = selectedOption.value;
        let currentUserCircunscripcionId = selectedOption.dataset.circunscripcionId || null;
        let currentUserRecintoId = selectedOption.dataset.recintoId || null;

        // Determine effective circunscripcion_id for precinct-based roles if not directly set
        if (currentUserRecintoId && !currentUserCircunscripcionId) {
            currentUserCircunscripcionId = recintosData.find(r => r._id === currentUserRecintoId)?.circunscripcion_id || null;
        }

        // Update UI (navigation visibility)
        updateUIByRole(currentUserRole);

        // Clear dashboard content
        document.getElementById('delegados-dashboard').innerHTML = '';
        document.getElementById('dirigentes-list').innerHTML = '';
        document.getElementById('actas-upload-view').innerHTML = '';
        document.getElementById('actas-review-view').innerHTML = '';

        // *** Update the map based on the new role and IDs ***
        loadRecintos(currentUserRole, currentUserCircunscripcionId, currentUserRecintoId);

        // Display role-specific information
        if (currentUserRole === 'candidato') {
            displayCandidatoInfo(currentUserCircunscripcionId);
        } else if (currentUserRole === 'jefe_recinto') {
            displayJefeRecintoInfo(currentUserRecintoId);
        } else if (currentUserRole === 'delegado') {
            const targetRecintoId = currentUserRecintoId || 'R001'; 
            const delegadoActual = usuariosData.find(u => u.rol === 'delegado' && u.recinto_asignado_id === targetRecintoId);
            if (delegadoActual) {
                displayDelegadoInfo(delegadoActual.recinto_asignado_id, delegadoActual._id, delegadoActual.mesa_asignada_numero);
            } else {
                document.getElementById('actas-upload-view').innerHTML = `<p>No hay un delegado de prueba asignado para el recinto ${targetRecintoId}.</p>
                                                                        <p>Intente seleccionar un rol de delegado con un recinto asignado como "Delegado (R001, Mesa 5)" o "Delegado (R003, Mesa 1)".</p>`;
            }
        } else if (currentUserRole === 'dirigente') {
            displayDirigenteInfo(currentUserCircunscripcionId);
        }

        showSection('mapa-container'); // Show map by default after role change
    };

    // Apply the initial role on page load
    applySelectedRole(); // This will now call loadRecintos correctly on initial load

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

async function loadRecintos(userRole, userCircunscripcionId, userRecintoId) {
    const delegadosPorMesa = 1;

    // Clear existing GeoJSON layers from the map
    mymap.eachLayer(function (layer) {
        if (layer instanceof L.GeoJSON) {
            mymap.removeLayer(layer);
        }
    });

    let filteredRecintos = [];
    let filteredBarrios = [];

    // --- Filter Recintos based on Role ---
    if (userRole === 'admin') {
        filteredRecintos = [...recintosData]; // Admin sees all recintos
    } else if (userRole === 'candidato' || userRole === 'dirigente') {
        // Candidato and Dirigente see all recintos within their assigned circunscripción
        if (userCircunscripcionId) {
            filteredRecintos = recintosData.filter(recinto => 
                recinto.circunscripcion_id === userCircunscripcionId
            );
        } else {
            console.warn(`Rol ${userRole} requiere circunscripción_id, pero no se proporcionó.`);
        }
    } else if (userRole === 'jefe_recinto' || userRole === 'delegado') {
        // Jefe de Recinto and Delegado see only their assigned recinto
        if (userRecintoId) {
            filteredRecintos = recintosData.filter(recinto => 
                (recinto._id || recinto.id) === userRecintoId
            );
        } else {
            console.warn(`Rol ${userRole} requiere recinto_id, pero no se proporcionó.`);
        }
    } else {
        // Default: no specific role, maybe show nothing or a very limited set
        filteredRecintos = []; 
    }

    // --- Filter Barrios based on Role (Optional, but recommended for consistency) ---
    if (userRole === 'admin') {
        filteredBarrios = [...barriosData]; // Admin sees all barrios
    } else if (userRole === 'candidato' || userRole === 'dirigente') {
        // Candidato and Dirigente see barrios within their assigned circunscripción
        if (userCircunscripcionId) {
            filteredBarrios = barriosData.filter(barrio => 
                barrio.circunscripcion_id === userCircunscripcionId
            );
        } else {
            filteredBarrios = [];
        }
    } else {
        // For Jefe de Recinto and Delegado, you might decide to show no barrios,
        // or only the barrio their precinct/mesa is in. For simplicity, let's show none for now.
        filteredBarrios = []; 
    }


    // --- Render Filtered Recintos ---
    filteredRecintos.forEach(recinto => {
        if (!recinto.numero_mesas) {
            console.warn(`Recinto ${recinto._id || recinto.id} no tiene numero_mesas. Asumiendo 1 mesa.`);
            recinto.numero_mesas = 1;
        }
        
        if (!recinto.delegados_requeridos) {
            recinto.delegados_requeridos = recinto.numero_mesas * delegadosPorMesa;
        }

        let fillColor;
        if (recinto.delegados_asignados >= recinto.delegados_requeridos) {
            fillColor = '#28a745'; // Green: Covered
        } else if (recinto.delegados_asignados > 0) {
            fillColor = '#ffc107'; // Yellow: Partially covered
        } else {
            fillColor = '#dc3545'; // Red: Not covered
        }

        const geojsonFeature = {
            "type": "Feature",
            "properties": {
                "id": recinto._id || recinto.id,
                "name": recinto.nombre,
                "mesas": recinto.numero_mesas,
                "delegados_requeridos": recinto.delegados_requeridos,
                "delegados_asignados": recinto.delegados_asignados,
                "cobertura": (recinto.delegados_asignados / recinto.delegados_requeridos * 100).toFixed(0) + '%'
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

    // --- Render Filtered Barrios ---
    filteredBarrios.forEach(barrio => {
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
        case 'candidato': // Changed from 'candidato_circunscripcion'
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

    const recintosEnCircunscripcion = recintosData.filter(r => r.circunscripcion_id === circunscripcionId);
    let totalMesas = 0;
    let totalDelegadosRequeridos = 0;
    let totalDelegadosAsignados = 0;

    if (recintosEnCircunscripcion.length > 0) {
        recintosEnCircunscripcion.forEach(recinto => {
            // Ensure delegados_requeridos is calculated/available for each recinto
            const requiredDelegates = recinto.delegados_requeridos || recinto.numero_mesas; 
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
                    // return `<li><b>Recinto: ${recinto?.nombre || 'N/A'}</b>, Mesa ${acta.mesa_numero}: <a href="${acta.url_foto_acta}" target="_blank">Ver Acta</a> (Estado: ${acta.estado_revision}) - Subida por: ${delegado?.nombre || 'N/A'} ${delegado?.apellido || ''}</li>`;
                    return `<li>
                        <div class="acta-item-header">
                            <b>Recinto: ${recinto?.nombre || 'N/A'}</b>, Mesa ${acta.mesa_numero}
                        </div>
                        <div class="acta-item-content">
                            <a href="${acta.url_foto_acta}" target="_blank" class="acta-image-link">
                                <img class="img-acta" src="${acta.url_foto_acta}" alt="Acta de Mesa ${acta.mesa_numero}"/>
                            </a>
                            <div class="acta-details">
                                <p>Estado: <span class="status-badge status-${acta.estado_revision}">${acta.estado_revision}</span></p>
                                <p>Subida por: ${delegado?.nombre || 'N/A'} ${delegado?.apellido || ''}</p>
                            </div>
                        </div>
                    </li>`;
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
        // Ensure delegados_requeridos is calculated/available
        const requiredDelegates = recintoAsignado.delegados_requeridos || recintoAsignado.numero_mesas;

        const delegadosRecinto = usuariosData.filter(u => u.rol === 'delegado' && u.recinto_asignado_id === (recintoAsignado._id || recintoAsignado.id));
        delegadosDashboard.innerHTML += `
            <h4>Recinto Asignado: ${recintoAsignado.nombre}</h4>
            <p>Dirección: ${recintoAsignado.direccion || 'N/A'}</p>
            <p>Mesas: ${recintoAsignado.numero_mesas}</p>
            <p>Delegados Requeridos: ${requiredDelegates}</p>
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
                // return `<li>Mesa ${acta.mesa_numero}: <a href="${acta.url_foto_acta}" target="_blank">Ver Acta</a> (Estado: ${acta.estado_revision}) - Subida por: ${delegado?.nombre || 'N/A'} ${delegado?.apellido || ''}</li>`+
                return `<li>
                            <div class="acta-summary">
                                <span class="acta-mesa">Mesa ${acta.mesa_numero}:</span>
                                <span class="acta-estado status-${acta.estado_revision}">${acta.estado_revision}</span>
                            </div>
                            <a href="${acta.url_foto_acta}" target="_blank" class="acta-link">
                                <img class="img-acta" src="${acta.url_foto_acta}" alt="Acta de Mesa ${acta.mesa_numero}">
                            </a>
                            <div class="acta-metadata">
                                <span>Subida por: ${delegado?.nombre || 'N/A'} ${delegado?.apellido || ''}</span>
                            </div>
                        </li>`;
            }).join('')}
        </ul>`;
    } else {
        actasReviewView.innerHTML += `<p>No hay actas subidas para este recinto.</p>`;
    }
}

// Updated displayDelegadoInfo to handle dynamic button event listener
function displayDelegadoInfo(recintoId, delegadoId, mesaNumero) { 
    const actasUploadView = document.getElementById('actas-upload-view');
    actasUploadView.innerHTML = `<h3>Subir Acta Electoral</h3>`;

    // Try to find the delegate in global data to get their assigned mesa_asignada_numero
    // Now, we are passed delegateId and mesaNumero directly for the current delegate being simulated
    const delegadoActual = usuariosData.find(u => u._id === delegadoId);
    
    if (delegadoActual) {
        actasUploadView.innerHTML += `
            <p>Asignado a: <b>${recintosData.find(r => (r._id || r.id) === recintoId)?.nombre || 'Recinto Desconocido'}</b>, Mesa: <b>${mesaNumero}</b></p>
            <input type="file" id="actaFileInput" accept="image/*"><br><br>
            <button id="uploadActaBtn">Subir Acta</button>
            <p id="uploadMessage"></p>
            <div id="uploadedImagePreview" style="margin-top: 15px;"></div>
        `;

        // IMPORTANT: Attach event listener AFTER the HTML is rendered
        const uploadActaBtn = document.getElementById('uploadActaBtn');
        if (uploadActaBtn) {
            uploadActaBtn.addEventListener('click', () => {
                handleActaUpload(
                    delegadoActual._id,
                    recintoId,
                    delegadoActual.mesa_asignada_numero // Use the mesa_asignada_numero from the found delegate
                );
            });
        }
    } else {
        actasUploadView.innerHTML = `<p>Actualmente, no está asignado a un recinto o mesa específica en nuestros datos de prueba.</p>
                                      <p>Intente seleccionar un rol de delegado con un recinto asignado como "Delegado (R001, Mesa 5)" o "Delegado (R003, Mesa 1)".</p>`;
    }
}

// Updated handleActaUpload function to use data-attributes for refreshing other sections
function handleActaUpload(delegadoId, recintoId, mesaNumero) {
    const fileInput = document.getElementById('actaFileInput');
    const uploadMessage = document.getElementById('uploadMessage');
    const uploadedImagePreview = document.getElementById('uploadedImagePreview'); // New element for preview

    if (!fileInput || !uploadMessage || !uploadedImagePreview) {
        console.error('Error: Elementos HTML para la subida de acta no encontrados.');
        return;
    }

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        let fileUrl = URL.createObjectURL(file); // Use actual blob URL for preview

        // Simulate adding to `actasData`
        const newActa = {
            "_id": `A${Date.now()}`, // Unique simulated ID
            "delegado_id": delegadoId,
            "recinto_id": recintoId,
            "mesa_numero": mesaNumero,
            "url_foto_acta": fileUrl,
            "fecha_hora_subida": new Date().toISOString(),
            "estado_revision": "pendiente"
        };
        actasData.push(newActa);

        uploadMessage.textContent = `Acta de Mesa ${mesaNumero} subida exitosamente!`;
        uploadMessage.style.color = 'green';
        console.log('Acta subida simulada:', newActa);

        // Display image preview
        uploadedImagePreview.innerHTML = `
            <p>Previsualización:</p>
            <img src="${fileUrl}" alt="Acta Subida" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px;">
        `;

        // IMPORTANT: Update other views based on the CURRENTLY SELECTED ROLE from the dropdown
        const roleSelect = document.getElementById('role-select');
        const currentSelectedOption = roleSelect.options[roleSelect.selectedIndex];
        const currentRole = currentSelectedOption.value; // e.g., 'admin', 'candidato', 'jefe_recinto'
        const currentCircunscripcionId = currentSelectedOption.dataset.circunscripcionId || null;
        const currentRecintoId = currentSelectedOption.dataset.recintoId || null;

        if (currentRole === 'jefe_recinto') {
            displayJefeRecintoInfo(currentRecintoId); // Recargar la info del jefe de recinto
        } else if (currentRole === 'candidato') { // Check for 'candidato' base role
            displayCandidatoInfo(currentCircunscripcionId); // Recargar la info del candidato
        } else if (currentRole === 'admin') {
            // Admin sees all, so maybe just refresh general lists if they exist or reload the map
            // For now, no specific refresh action for admin
        }

        // Clear the file input for future uploads
        fileInput.value = '';

    } else {
        uploadMessage.textContent = 'Por favor, selecciona un archivo de imagen.';
        uploadMessage.style.color = 'red';
        uploadedImagePreview.innerHTML = ''; // Clear preview if no file selected
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
    const recintosEnCircunscripcion = recintosData.filter(r => r.circunscripcion_id === circunscripcionId);
    let totalMesas = 0;
    let totalDelegadosRequeridos = 0;
    let totalDelegadosAsignados = 0;

    recintosEnCircunscripcion.forEach(recinto => {
        const requiredDelegates = recinto.delegados_requeridos || recinto.numero_mesas; // Ensure required delegates are present
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