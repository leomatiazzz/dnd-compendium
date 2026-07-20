document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. THEME TOGGLE & LOCAL STORAGE ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // Check saved theme
    if (localStorage.getItem('theme') === 'light') {
        body.classList.add('light-mode');
    }

    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('light-mode');
        if (body.classList.contains('light-mode')) {
            localStorage.setItem('theme', 'light');
        } else {
            localStorage.setItem('theme', 'dark');
        }
    });

    // --- 2. HERO GREETING (LOCAL STORAGE) ---
    const savedHeroName = localStorage.getItem('heroName');
    const heroTitle = document.getElementById('hero-title');
    if (savedHeroName) {
        heroTitle.innerText = `Bem vindo de volta à guilda, ${savedHeroName}!`;
    }

    // --- 3. SMOOTH SCROLLING ---
    const ctaBtn = document.getElementById('cta-btn');
    ctaBtn.addEventListener('click', () => {
        document.getElementById('compendium').scrollIntoView({ behavior: 'smooth' });
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // --- 4. TABS & DATALIST AUTOCOMPLETE ---
    let currentTab = 'spells';
    let currentListData = []; // Store the API list for the current tab

    const tabBtns = document.querySelectorAll('.tab-btn');
    const apiInput = document.getElementById('api-input');
    const datalist = document.getElementById('api-suggestions');
    const resultContainer = document.getElementById('result-container');
    const compendiumDesc = document.getElementById('compendium-desc');
    const searchBtn = document.getElementById('search-btn');

    // Initial load for spells
    fetchTabList('spells');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // UI Update
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // State Update
            currentTab = btn.getAttribute('data-tab');
            apiInput.value = '';
            resultContainer.classList.add('hidden');
            
            // Description Update
            if (currentTab === 'spells') compendiumDesc.innerText = 'Consulte as magias arcanas e divinas.';
            else if (currentTab === 'monsters') compendiumDesc.innerText = 'Pesquise por criaturas e feras.';
            else if (currentTab === 'classes') compendiumDesc.innerText = 'Descubra os caminhos dos heróis.';

            // Fetch new datalist
            fetchTabList(currentTab);
        });
    });

    async function fetchTabList(endpoint) {
        apiInput.placeholder = 'Carregando arquivos da biblioteca...';
        apiInput.disabled = true;
        try {
            const res = await fetch(`https://www.dnd5eapi.co/api/${endpoint}`);
            const data = await res.json();
            currentListData = data.results;
            
            // Populate datalist
            datalist.innerHTML = '';
            currentListData.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                datalist.appendChild(option);
            });

            apiInput.placeholder = 'Digite o nome (em inglês)...';
            apiInput.disabled = false;
        } catch (error) {
            apiInput.placeholder = 'Erro ao carregar dados.';
        }
    }

    // --- 5. SEARCH & DYNAMIC RENDERING ---
    searchBtn.addEventListener('click', executeSearch);
    apiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            executeSearch();
        }
    });

    async function executeSearch() {
        const queryName = apiInput.value.trim().toLowerCase();
        if (!queryName) return;

        // Find the index in our current list
        const match = currentListData.find(item => item.name.toLowerCase() === queryName);
        
        let queryIndex = '';
        if (match) {
            queryIndex = match.index;
        } else {
            // Fallback string replacement if they bypass autocomplete
            queryIndex = queryName.replace(/\s+/g, '-');
        }

        resultContainer.innerHTML = '<p>Consultando os pergaminhos antigos...</p>';
        resultContainer.classList.remove('hidden');

        try {
            const response = await fetch(`https://www.dnd5eapi.co/api/${currentTab}/${queryIndex}`);
            if (!response.ok) throw new Error('Registro não encontrado.');
            
            const data = await response.json();
            
            if (currentTab === 'spells') displaySpell(data);
            else if (currentTab === 'monsters') displayMonster(data);
            else if (currentTab === 'classes') displayClass(data);
            
        } catch (error) {
            showResultError(`Não encontramos "${apiInput.value}" nos registros. Verifique a ortografia.`);
        }
    }

    function displaySpell(spell) {
        const level = spell.level === 0 ? 'Truque (Cantrip)' : `Nível ${spell.level}`;
        const components = spell.components.join(', ');
        const desc = spell.desc.map(d => `<p>${d}</p>`).join('');
        
        resultContainer.innerHTML = `
            <h3>${spell.name}</h3>
            <p><strong>Nível e Escola:</strong> ${level} - ${spell.school.name}</p>
            <p><strong>Tempo de Conjuração:</strong> ${spell.casting_time}</p>
            <p><strong>Alcance:</strong> ${spell.range}</p>
            <p><strong>Componentes:</strong> ${components}</p>
            <p><strong>Duração:</strong> ${spell.duration}</p>
            <hr style="border: 0; border-top: 1px solid var(--primary-color); margin: 20px 0;">
            <div class="description">${desc}</div>
        `;
    }

    function displayMonster(monster) {
        const imgHtml = monster.image ? `<img src="https://www.dnd5eapi.co${monster.image}" alt="${monster.name}" class="monster-image">` : '';
        const ac = monster.armor_class.length > 0 ? monster.armor_class[0].value : 'N/A';
        
        resultContainer.innerHTML = `
            <h3>${monster.name}</h3>
            ${imgHtml}
            <p><strong>Tipo:</strong> ${monster.size} ${monster.type}, ${monster.alignment}</p>
            <p><strong>Classe de Armadura (AC):</strong> ${ac}</p>
            <p><strong>Pontos de Vida (HP):</strong> ${monster.hit_points}</p>
            <p><strong>Desafio (CR):</strong> ${monster.challenge_rating}</p>
            <hr style="border: 0; border-top: 1px solid var(--primary-color); margin: 20px 0;">
            <p><strong>For:</strong> ${monster.strength} | <strong>Des:</strong> ${monster.dexterity} | <strong>Con:</strong> ${monster.constitution} | <strong>Int:</strong> ${monster.intelligence} | <strong>Sab:</strong> ${monster.wisdom} | <strong>Car:</strong> ${monster.charisma}</p>
        `;
    }

    function displayClass(cls) {
        const proficiencies = cls.proficiencies.map(p => p.name).join(', ');
        
        resultContainer.innerHTML = `
            <h3>${cls.name}</h3>
            <p><strong>Dado de Vida (Hit Die):</strong> d${cls.hit_die}</p>
            <p><strong>Proficiências Iniciais:</strong> ${proficiencies}</p>
            <hr style="border: 0; border-top: 1px solid var(--primary-color); margin: 20px 0;">
            <p>Para ver a progressão completa de níveis, equipamentos e subclasses, visite os registros completos do jogador.</p>
        `;
    }

    function showResultError(message) {
        resultContainer.innerHTML = `<p style="color: #ff6b6b;"><strong>Atenção:</strong> ${message}</p>`;
    }

    // --- 6. CONTACT FORM & LOCAL STORAGE ---
    const guildForm = document.getElementById('guild-form');
    const formSuccess = document.getElementById('form-success');
    const nameInput = document.getElementById('name');

    guildForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Save Name to Local Storage
        const heroName = nameInput.value.trim();
        if (heroName) {
            localStorage.setItem('heroName', heroName);
        }
        
        guildForm.style.display = 'none';
        formSuccess.classList.remove('hidden');
    });
});
