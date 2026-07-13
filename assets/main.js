// Correo de destino de los formularios
const CONTACT_EMAIL = "luisgoncundapi4576@gmail.com";

// ---------- Formulario de contacto ----------
const contactForm = document.getElementById('contactForm');
if (contactForm){
  contactForm.addEventListener('submit', function(e){
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const course = document.getElementById('course').value;
    const message = document.getElementById('message').value;
    const subject = encodeURIComponent(`Consulta de curso — ${course}`);
    const body = encodeURIComponent(`Nombre: ${name}\nCorreo: ${email}\nCurso de interés: ${course}\n\n${message}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  });
}

// ---------- Opiniones: carga y publicación de comentarios ----------
const COMMENTS_ENDPOINT = '/.netlify/functions/comments';

function starString(n){
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function formatReviewDate(iso){
  try {
    return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return '';
  }
}

function renderReviews(list){
  const container = document.getElementById('reviewsList');
  if (!container) return;
  if (!Array.isArray(list) || list.length === 0){
    container.innerHTML = '<p class="reviews-status">Todavía no hay opiniones publicadas. Sé el primero en compartir tu experiencia.</p>';
    return;
  }
  container.innerHTML = list.map(function(r){
    return (
      '<div class="course-card reveal is-visible">' +
        '<div class="stars" aria-label="' + r.rating + ' de 5 estrellas">' + starString(r.rating) + '</div>' +
        '<p>&ldquo;' + r.comment + '&rdquo;</p>' +
        '<h3 style="font-size:0.95rem;">' + r.name + '</h3>' +
        '<span class="edit-flag">' + r.course + ' · ' + formatReviewDate(r.date) + '</span>' +
      '</div>'
    );
  }).join('');
}

function loadReviews(){
  const container = document.getElementById('reviewsList');
  fetch(COMMENTS_ENDPOINT)
    .then(function(res){
      if (!res.ok) throw new Error('No se pudieron cargar las opiniones.');
      return res.json();
    })
    .then(renderReviews)
    .catch(function(){
      if (container) container.innerHTML = '<p class="reviews-status">No se pudieron cargar las opiniones. Intenta recargar la página.</p>';
    });
}

const reviewForm = document.getElementById('reviewForm');
if (reviewForm){
  loadReviews();

  reviewForm.addEventListener('submit', function(e){
    e.preventDefault();
    const note = document.getElementById('reviewFormNote');
    const submitBtn = reviewForm.querySelector('button[type="submit"]');
    const name = document.getElementById('revName').value;
    const course = document.getElementById('reviewCourse').value;
    const ratingInput = document.querySelector('input[name="rating"]:checked');
    const rating = ratingInput ? parseInt(ratingInput.value, 10) : null;
    const comment = document.getElementById('revComment').value;

    if (!rating){
      if (note) note.textContent = 'Selecciona una calificación de 1 a 5 estrellas.';
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (note) note.textContent = 'Enviando…';

    fetch(COMMENTS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, course: course, rating: rating, comment: comment })
    })
      .then(function(res){
        if (!res.ok){
          return res.json().then(function(data){
            throw new Error((data && data.error) || 'No se pudo publicar la opinión.');
          });
        }
        return res.json();
      })
      .then(function(){
        reviewForm.reset();
        if (note) note.textContent = 'Gracias, tu opinión se publicó correctamente.';
        loadReviews();
      })
      .catch(function(err){
        if (note) note.textContent = err.message || 'No se pudo publicar la opinión. Intenta de nuevo.';
      })
      .finally(function(){
        if (submitBtn) submitBtn.disabled = false;
      });
  });
}

// ---------- Animación de entrada del diagrama de viga (solo inicio) ----------
const heroDiagram = document.getElementById('heroDiagram');
if (heroDiagram){
  window.addEventListener('load', function(){
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        heroDiagram.classList.add('is-visible');
      });
    });
  });
}

// ---------- Revelado genérico al hacer scroll ----------
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length){
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:0.15});
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('is-visible'); });
  }
}
