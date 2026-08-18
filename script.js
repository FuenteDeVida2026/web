let editandoId = null; // Almacena el id del evento que se está editando

// ===== CONFIGURACIÓN =====
const SUPABASE_URL = 'https://uxmktweqfhhwokhfujlp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bWt0d2VxZmhod29raGZ1amxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODYzNzMsImV4cCI6MjEwMjU2MjM3M30.JJN5P9MMxm5LLyf0ptYbiFA3GJgI0i0HYePSAhgjYis';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CLOUDINARY_CLOUD_NAME = 'xifh4ozb';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

// URL de la Edge Function que elimina imágenes en Cloudinary
const CLOUDINARY_DELETE_URL = 'https://uxmktweqfhhwokhfujlp.supabase.co/functions/v1/delete-cloudinary-image';

// ===== MENÚ HAMBURGUESA =====
const btnHamburguesa = document.getElementById('btn-hamburguesa');
const navMenu = document.getElementById('nav-menu');

btnHamburguesa.addEventListener('click', () => {
    btnHamburguesa.classList.toggle('activo');
    navMenu.classList.toggle('abierto');
});

document.querySelectorAll('.nav-menu a').forEach(enlace => {
    enlace.addEventListener('click', () => {
        btnHamburguesa.classList.remove('activo');
        navMenu.classList.remove('abierto');
    });
});

// ===== NAVEGACIÓN ACTIVA =====
const secciones = document.querySelectorAll('section[id]');
const enlacesNav = document.querySelectorAll('.nav-menu a');

window.addEventListener('scroll', () => {
    let actual = '';
    secciones.forEach(seccion => {
        const top = seccion.offsetTop - 150;
        const bottom = top + seccion.offsetHeight;
        if (window.scrollY >= top && window.scrollY < bottom) {
            actual = seccion.getAttribute('id');
        }
    });

    enlacesNav.forEach(enlace => {
        enlace.classList.remove('activo');
        if (enlace.getAttribute('href') === '#' + actual) {
            enlace.classList.add('activo');
        }
    });
});

// ===== ANIMACIONES DE SCROLL =====
const observer = new IntersectionObserver((entradas) => {
    entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
            entrada.target.classList.add('visible');
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.animar').forEach(elemento => {
    observer.observe(elemento);
});

// ===== AÑO DINÁMICO =====
const yearSpan = document.getElementById('anio-actual');
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

// ===== AUTENTICACIÓN =====
function abrirLogin() {
    document.getElementById('modal-login').style.display = 'flex';
}

function cerrarLogin() {
    document.getElementById('modal-login').style.display = 'none';
}

function cerrarPanel() {
    document.getElementById('panel-admin').style.display = 'none';
}

async function loginAdmin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        cerrarLogin();
        document.getElementById('usuario-actual').textContent = `Conectado como: ${data.user.email}`;
        document.getElementById('panel-admin').style.display = 'block';
        cargarEventosAdmin();
        cargarFotosAdmin();
    } catch (error) {
        alert('Error al iniciar sesión: ' + error.message);
    }
}

async function logout() {
    await supabaseClient.auth.signOut();
    document.getElementById('panel-admin').style.display = 'none';
    document.getElementById('usuario-actual').textContent = '';
    cerrarPanel();
}

// Verificar sesión al cargar
window.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        document.getElementById('panel-admin').style.display = 'block';
        document.getElementById('usuario-actual').textContent = `Conectado como: ${session.user.email}`;
        cargarEventosAdmin();
        cargarFotosAdmin();
    }
    // Cargar datos públicos
    cargarEventos();
    cargarFotos();
});

// ===== SUBIDA DE IMÁGENES CON CLOUDINARY =====
function subirImagenEvento() {
    cloudinary.createUploadWidget({
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        folder: 'eventos',
        multiple: false,
        clientAllowedFormats: ['image'],
    }, (error, result) => {
        if (!error && result && result.event === 'success') {
            document.getElementById('evento-imagen-url').value = result.info.secure_url;
            alert('Imagen subida correctamente');
        }
    }).open();
}

function subirImagenGaleria() {
    cloudinary.createUploadWidget({
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        folder: 'galeria',
        multiple: false,
        clientAllowedFormats: ['image'],
    }, (error, result) => {
        if (!error && result && result.event === 'success') {
            document.getElementById('foto-url').value = result.info.secure_url;
            alert('Imagen subida correctamente');
        }
    }).open();
}

// ===== CRUD DE EVENTOS =====
async function cargarEventos() {
    const contenedor = document.getElementById('eventos-lista');
    if (!contenedor) return;

    const { data, error } = await supabaseClient
        .from('eventos')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error cargando eventos:', error);
        contenedor.innerHTML = '<p style="text-align:center; color:#666;">No hay eventos disponibles.</p>';
        return;
    }

    contenedor.innerHTML = '';
    if (data.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center; color:#666;">Próximamente anunciaremos eventos.</p>';
        return;
    }

    data.forEach(evento => {
        const card = document.createElement('div');
        card.className = 'evento-card';

        const imagenHTML = evento.imagen_url
            ? `<img src="${evento.imagen_url}" alt="${evento.titulo}" class="evento-imagen" style="cursor:pointer;">`
            : `<div class="evento-imagen-placeholder"><i class="fas fa-church"></i></div>`;

        const descripcionHTML = evento.descripcion
            ? `<p class="evento-descripcion">${evento.descripcion}</p>`
            : '';

        card.innerHTML = `
            <div class="evento-contenido">
                <span class="evento-categoria">${evento.categoria}</span>
                <h3 class="evento-titulo">${evento.titulo}</h3>
                <div class="evento-detalles">
                    <span class="evento-dato"><i class="fas fa-calendar-day"></i> Día: ${evento.dia}</span>
                    <span class="evento-dato"><i class="fas fa-calendar-alt"></i> Mes: ${evento.mes}</span>
                    <span class="evento-dato"><i class="fas fa-clock"></i> Hora: ${evento.hora}</span>
                    <span class="evento-dato"><i class="fas fa-map-marker-alt"></i> Ubicación: ${evento.lugar}</span>
                </div>
                ${descripcionHTML}
            </div>
            <div class="evento-imagen-contenedor">
                ${imagenHTML}
            </div>
        `;

        contenedor.appendChild(card);
    });
}

async function cargarEventosAdmin() {
    const contenedor = document.getElementById('lista-eventos-admin');
    if (!contenedor) return;

    const { data, error } = await supabaseClient.from('eventos').select('*').order('created_at');
    if (error) {
        console.error(error);
        return;
    }

    contenedor.innerHTML = '';
    if (data.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center; color:#666;">No hay eventos registrados.</p>';
        return;
    }

    data.forEach(evento => {
        const item = document.createElement('div');
        item.className = 'evento-admin-item';
        item.innerHTML = `
            <div class="info">
                <span class="titulo">${evento.titulo}</span>
                <span class="detalle"><i class="fas fa-calendar"></i> ${evento.dia} ${evento.mes} &nbsp;|&nbsp; <i class="fas fa-clock"></i> ${evento.hora}</span>
            </div>
            <div class="acciones">
                <button class="btn-editar" onclick="prepararEdicion('${evento.id}')"><i class="fas fa-edit"></i> Editar</button>
                <button class="btn-eliminar" onclick="eliminarEvento('${evento.id}')"><i class="fas fa-trash"></i> Eliminar</button>
            </div>
        `;
        contenedor.appendChild(item);
    });
}

function validarEvento() {
    const camposObligatorios = ['evento-titulo','evento-dia','evento-mes','evento-hora','evento-lugar','evento-categoria'];
    for (const id of camposObligatorios) {
        const campo = document.getElementById(id);
        if (!campo.value.trim()) {
            campo.style.borderColor = 'red';
            mostrarMensajeValidacion('Por favor completa los campos marcados en rojo.');
            return false;
        } else {
            campo.style.borderColor = '';
        }
    }
    return true;
}

function mostrarMensajeValidacion(mensaje) {
    const div = document.getElementById('mensaje-validacion');
    div.textContent = mensaje;
    div.style.display = 'block';
    setTimeout(() => div.style.display = 'none', 4000);
}

function limpiarFormularioEvento() {
    ['evento-id','evento-titulo','evento-descripcion','evento-dia','evento-mes','evento-hora','evento-lugar','evento-categoria','evento-imagen-url'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('preview-imagen').innerHTML = '';
    editandoId = null;
    document.getElementById('formulario-titulo').textContent = '➕ Nuevo evento';
    document.getElementById('btn-cancelar').style.display = 'none';
}

async function guardarEvento() {
    if (!validarEvento()) return;

    const id = document.getElementById('evento-id').value;
    const titulo = document.getElementById('evento-titulo').value.trim();
    const descripcion = document.getElementById('evento-descripcion').value.trim();
    const dia = document.getElementById('evento-dia').value.trim();
    const mes = document.getElementById('evento-mes').value.trim();
    const hora = document.getElementById('evento-hora').value.trim();
    const lugar = document.getElementById('evento-lugar').value.trim();
    const categoria = document.getElementById('evento-categoria').value;
    const imagen_url = document.getElementById('evento-imagen-url').value.trim();

    const datos = { titulo, descripcion, dia, mes, hora, lugar, categoria, imagen_url };

    let error = null;
    if (id) {
        // Actualizar evento existente
        ({ error } = await supabaseClient.from('eventos').update(datos).eq('id', id));
    } else {
        // Crear nuevo evento
        ({ error } = await supabaseClient.from('eventos').insert([datos]));
    }

    if (error) {
        alert('Error al guardar: ' + error.message);
        return;
    }
    alert(id ? 'Evento actualizado correctamente' : 'Evento agregado correctamente');
    limpiarFormularioEvento();
    cargarEventos();
    cargarEventosAdmin();
}

async function prepararEdicion(id) {
    const { data, error } = await supabaseClient.from('eventos').select('*').eq('id', id).single();
    if (error) {
        alert('Error al cargar evento: ' + error.message);
        return;
    }

    document.getElementById('evento-id').value = data.id;
    document.getElementById('evento-titulo').value = data.titulo;
    document.getElementById('evento-descripcion').value = data.descripcion || '';
    document.getElementById('evento-dia').value = data.dia;
    document.getElementById('evento-mes').value = data.mes;
    document.getElementById('evento-hora').value = data.hora;
    document.getElementById('evento-lugar').value = data.lugar;
    document.getElementById('evento-categoria').value = data.categoria;
    document.getElementById('evento-imagen-url').value = data.imagen_url || '';
    if (data.imagen_url) {
        document.getElementById('preview-imagen').innerHTML = `<img src="${data.imagen_url}" style="max-width:100%; border-radius:8px; margin-top:5px;">`;
    }

    editandoId = id;
    document.getElementById('formulario-titulo').textContent = '✏️ Editar evento';
    document.getElementById('btn-cancelar').style.display = 'inline-block';
    document.getElementById('formulario-titulo').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicion() {
    limpiarFormularioEvento();
}

// Función para extraer el public_id de una URL de Cloudinary
function extraerPublicId(url) {
    if (!url || !url.includes('res.cloudinary.com')) return null;
    // Ejemplo: https://res.cloudinary.com/xifh4ozb/image/upload/v1234567890/eventos/imagen.jpg
    const match = url.match(/\/v\d+\/(.+?)\.(jpg|jpeg|png|gif|webp|bmp)$/);
    return match ? match[1] : null;
}

async function eliminarEvento(id) {
    if (!confirm('¿Estás seguro de eliminar este evento?')) return;

    // Obtener sesión actual de Supabase
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const token = sessionData?.session?.access_token;

    // Obtener el evento para tener la URL de la imagen
    const { data: evento, error: errorEvento } = await supabaseClient
        .from('eventos')
        .select('imagen_url')
        .eq('id', id)
        .single();

    if (errorEvento) {
        alert('Error al obtener evento: ' + errorEvento.message);
        return;
    }

    // Si tiene imagen, intentar eliminarla de Cloudinary
    if (evento?.imagen_url) {
        const publicId = extraerPublicId(evento.imagen_url);
        if (publicId) {
            try {
                await fetch(CLOUDINARY_DELETE_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ public_id: publicId }),
                });
            } catch (error) {
                console.error('Error al eliminar imagen de Cloudinary:', error);
            }
        }
    }

    // Eliminar el evento de Supabase
    const { error } = await supabaseClient.from('eventos').delete().eq('id', id);
    if (error) {
        alert('Error al eliminar evento: ' + error.message);
        return;
    }

    alert('Evento eliminado');
    cargarEventos();
    cargarEventosAdmin();
}
// ===== CRUD DE FOTOS (GALERÍA) =====
async function cargarFotos() {
    const contenedor = document.getElementById('galeria');
    if (!contenedor) return;

    const { data, error } = await supabaseClient.from('fotos').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error(error);
        return;
    }

    contenedor.innerHTML = '';
    data.forEach(foto => {
        contenedor.innerHTML += `
            <div style="position:relative; margin:10px; display:inline-block;">
                <img src="${foto.url}" alt="${foto.descripcion || ''}" class="galeria-img" style="width:200px; height:200px; object-fit:cover; border-radius:12px; cursor:pointer;">
                ${foto.descripcion ? `<p style="text-align:center; font-size:0.9rem; color:#666;">${foto.descripcion}</p>` : ''}
            </div>
        `;
    });
}

async function cargarFotosAdmin() {
    const contenedor = document.getElementById('lista-fotos-admin');
    if (!contenedor) return;

    const { data, error } = await supabaseClient.from('fotos').select('*').order('created_at');
    if (error) {
        console.error(error);
        return;
    }

    contenedor.innerHTML = '';
    data.forEach(foto => {
        const div = document.createElement('div');
        div.className = 'foto-admin-item';
        div.innerHTML = `
            <img src="${foto.url}" alt="${foto.descripcion || ''}">
            <button onclick="eliminarFoto('${foto.id}')" title="Eliminar foto"><i class="fas fa-trash"></i></button>
            ${foto.descripcion ? `<div style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.6); color:white; font-size:0.7rem; padding:4px 8px;">${foto.descripcion}</div>` : ''}
        `;
        contenedor.appendChild(div);
    });
}

async function agregarFoto() {
    const url = document.getElementById('foto-url').value;
    const descripcion = document.getElementById('foto-descripcion').value;
    if (!url) {
        alert('La URL de la foto es obligatoria');
        return;
    }

    const { error } = await supabaseClient.from('fotos').insert([{ url, descripcion }]);
    if (error) {
        alert('Error: ' + error.message);
        return;
    }
    alert('Foto agregada');
    document.getElementById('foto-url').value = '';
    document.getElementById('foto-descripcion').value = '';
    cargarFotos();
    cargarFotosAdmin();
}

async function eliminarFoto(id) {
    if (!confirm('¿Eliminar esta foto?')) return;

    // Obtener sesión actual de Supabase
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const token = sessionData?.session?.access_token;

    // Obtener la foto para tener la URL
    const { data: foto, error: errorFoto } = await supabaseClient
        .from('fotos')
        .select('url')
        .eq('id', id)
        .single();

    if (errorFoto) {
        alert('Error al obtener foto: ' + errorFoto.message);
        return;
    }

    // Si tiene imagen, intentar eliminarla de Cloudinary
    if (foto?.url) {
        const publicId = extraerPublicId(foto.url);
        if (publicId) {
            try {
                await fetch(CLOUDINARY_DELETE_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ public_id: publicId }),
                });
            } catch (error) {
                console.error('Error al eliminar imagen de Cloudinary:', error);
            }
        }
    }

    // Eliminar la foto de Supabase
    const { error } = await supabaseClient.from('fotos').delete().eq('id', id);
    if (error) {
        alert('Error al eliminar foto: ' + error.message);
        return;
    }

    alert('Foto eliminada');
    cargarFotos();
    cargarFotosAdmin();
}

// ===== LIGHTBOX (abrir imágenes sin salir de la página) =====
function abrirLightbox(url) {
    document.getElementById('lightbox-img').src = url;
    document.getElementById('lightbox').style.display = 'flex';
}

function cerrarLightbox() {
    document.getElementById('lightbox').style.display = 'none';
    document.getElementById('lightbox-img').src = '';
}

// Delegación de eventos para imágenes con clase específica
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('evento-imagen')) {
        abrirLightbox(e.target.src);
    }
    if (e.target.classList.contains('galeria-img')) {
        abrirLightbox(e.target.src);
    }
});