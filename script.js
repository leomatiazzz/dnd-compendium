document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Smooth Scrolling and CTA Button
    const ctaBtn = document.getElementById('cta-btn');
    ctaBtn.addEventListener('click', () => {
        const compendiumSection = document.getElementById('compendium');
        compendiumSection.scrollIntoView({ behavior: 'smooth' });
    });

    // Handle all nav links for smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // 2. API Consumption (D&D 5e API)
    const searchBtn = document.getElementById('search-btn');
    const spellInput = document.getElementById('spell-input');
    const resultContainer = document.getElementById('result-container');

    searchBtn.addEventListener('click', searchSpell);
    spellInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchSpell();
        }
    });

    async function searchSpell() {
        const query = spellInput.value.trim().toLowerCase().replace(/\s+/g, '-');
        
        if (!query) {
            showResultError('Por favor, digite o nome de uma magia. Ex: fireball');
            return;
        }

        // Loading state
        resultContainer.innerHTML = '<p>Consultando os pergaminhos antigos...</p>';
        resultContainer.classList.remove('hidden');

        try {
            // API Call
            const response = await fetch(`https://www.dnd5eapi.co/api/spells/${query}`);
            
            if (!response.ok) {
                throw new Error('Magia não encontrada nos registros.');
            }

            const data = await response.json();
            displaySpellData(data);
            
        } catch (error) {
            showResultError('Magia não encontrada. Verifique se o nome está correto (em inglês). Ex: cure-wounds, magic-missile');
        }
    }

    function displaySpellData(spell) {
        // Formating data
        const level = spell.level === 0 ? 'Truque (Cantrip)' : `Nível ${spell.level}`;
        const components = spell.components.join(', ');
        const classes = spell.classes.map(c => c.name).join(', ');
        
        // Convert markdown-like descriptions to HTML paragraphs
        const description = spell.desc.map(d => `<p>${d}</p>`).join('');
        
        const higherLevel = spell.higher_level ? 
            `<p><strong>Em Níveis Superiores:</strong> ${spell.higher_level.join(' ')}</p>` : '';

        const html = `
            <h3>${spell.name}</h3>
            <p><strong>Nível e Escola:</strong> ${level} - ${spell.school.name}</p>
            <p><strong>Tempo de Conjuração:</strong> ${spell.casting_time}</p>
            <p><strong>Alcance:</strong> ${spell.range}</p>
            <p><strong>Componentes:</strong> ${components} ${spell.material ? `(${spell.material})` : ''}</p>
            <p><strong>Duração:</strong> ${spell.duration} ${spell.concentration ? '(Concentração)' : ''}</p>
            <p><strong>Classes:</strong> ${classes}</p>
            <hr style="border: 0; border-top: 1px solid var(--primary-color); margin: 20px 0;">
            <div class="spell-description">
                ${description}
                ${higherLevel}
            </div>
        `;

        resultContainer.innerHTML = html;
    }

    function showResultError(message) {
        resultContainer.innerHTML = `<p style="color: #ff6b6b;"><strong>Erro:</strong> ${message}</p>`;
    }

    // 3. Contact Form Submission
    const guildForm = document.getElementById('guild-form');
    const formSuccess = document.getElementById('form-success');

    guildForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent page reload
        
        // In a real app, you would send the data to a server here.
        // For this task, we just show the success message.
        
        guildForm.style.display = 'none'; // Hide form
        formSuccess.classList.remove('hidden'); // Show success message
        
        // Optional: Reset form fields if they want to submit again later
        guildForm.reset();
        
        // Optional: Re-show form after 5 seconds
        /*
        setTimeout(() => {
            guildForm.style.display = 'block';
            formSuccess.classList.add('hidden');
        }, 5000);
        */
    });
});
