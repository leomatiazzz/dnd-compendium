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

    if (!document.getElementById('hero-title')) return; // Para execução se não for a página principal

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
    let currentListData = []; // Armazena a lista de APIs da aba atual

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
            // Atualiza a interface
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Atualiza o estado
            currentTab = btn.getAttribute('data-tab');
            apiInput.value = '';
            resultContainer.classList.add('hidden');
            
            // Atualiza a descrição
            if (currentTab === 'spells') compendiumDesc.innerText = 'Consulte as magias arcanas e divinas.';
            else if (currentTab === 'monsters') compendiumDesc.innerText = 'Pesquise por criaturas e feras.';
            else if (currentTab === 'classes') compendiumDesc.innerText = 'Descubra os caminhos dos heróis.';
            else if (currentTab === 'races') compendiumDesc.innerText = 'Conheça os povos que habitam este mundo.';
            else if (currentTab === 'magic-items') compendiumDesc.innerText = 'Encontre artefatos e relíquias de poder.';

            // Busca nova lista
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
            
            // Preenche a datalist
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

        // Encontra o index na lista atual
        const match = currentListData.find(item => item.name.toLowerCase() === queryName);
        
        let queryIndex = '';
        if (match) {
            queryIndex = match.index;
        } else {
            // Fallback de substituição de string se eles burlarem o autocompletar
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
            else if (currentTab === 'races') displayRace(data);
            else if (currentTab === 'magic-items') displayMagicItem(data);
            
        } catch (error) {
            showResultError(`Não encontramos "${apiInput.value}" nos registros. Verifique a ortografia.`);
        }
    }

    function displaySpell(spell) {
        const level = spell.level === 0 ? 'Truque (Cantrip)' : `Nível ${spell.level}`;
        const components = spell.components.join(', ');
        const description = spell.desc.map(d => `<p>${d}</p>`).join('');
        
        resultContainer.innerHTML = `
            <h3>${spell.name}</h3>
            <p><strong>Nível e Escola:</strong> ${level} - ${spell.school.name}</p>
            <p><strong>Tempo de Conjuração:</strong> ${spell.casting_time}</p>
            <strong>Alcance:</strong> ${spell.range} <br>
            <strong>Componentes:</strong> ${spell.components.join(', ')} <br>
            <strong>Duração:</strong> ${spell.duration} <br>
        </p>
        <hr style="border: 0; border-top: 1px solid var(--primary-color); margin: 20px 0;">
        <div class="description">${description}</div>
        `;
    }

    function displayMonster(monster) {
        const imgHtml = monster.image ? `<img src="https://www.dnd5eapi.co${monster.image}" alt="${monster.name}" class="card-image">` : '';
        const armorClass = monster.armor_class[0].value;
        const speed = Object.entries(monster.speed).map(([k, v]) => `${k}: ${v}`).join(', ');
        
        resultContainer.innerHTML = `
            <h3>${monster.name}</h3>
            ${imgHtml}
            <p><strong>Tipo:</strong> ${monster.size} ${monster.type}, ${monster.alignment}</p>
            <p><strong>Classe de Armadura (AC):</strong> ${armorClass}</p>
            <p><strong>Pontos de Vida (HP):</strong> ${monster.hit_points}</p>
            <p><strong>Deslocamento:</strong> ${speed}</p>
            <p><strong>Desafio (CR):</strong> ${monster.challenge_rating}</p>
            <hr style="border: 0; border-top: 1px solid var(--primary-color); margin: 20px 0;">
            <p><strong>For:</strong> ${monster.strength} | <strong>Des:</strong> ${monster.dexterity} | <strong>Con:</strong> ${monster.constitution} | <strong>Int:</strong> ${monster.intelligence} | <strong>Sab:</strong> ${monster.wisdom} | <strong>Car:</strong> ${monster.charisma}</p>
        `;
    }

    const classDescriptions = {
        "barbarian": "<p>Bárbaros são guerreiros poderosos impulsionados por forças primordiais do multiverso que se manifestam como uma Fúria. Mais do que uma simples emoção — e não se limitando à raiva —, essa Fúria é a encarnação da ferocidade de um predador, da fúria de uma tempestade e da agitação do mar.</p><p>Alguns bárbaros personificam sua Fúria como um espírito feroz ou um ancestral reverenciado. Outros a veem como uma conexão com a dor e a angústia do mundo, como um emaranhado impessoal de magia selvagem ou como uma expressão de seu próprio eu mais profundo. Para todo bárbaro, sua Fúria é um poder que alimenta não apenas a proeza em batalha, mas também reflexos extraordinários e sentidos aguçados.</p><p>Bárbaros frequentemente atuam como protetores e líderes em suas comunidades. Eles avançam impetuosamente em direção ao perigo para que aqueles sob sua proteção não precisem fazê-lo. Sua coragem diante do perigo torna os bárbaros candidatos perfeitos para a aventura.</p>",
        "bard": "<p>Ao invocar magia por meio de música, dança e versos, os bardos são especialistas em inspirar outros, amenizar sofrimentos, desmoralizar inimigos e criar ilusões. Os bardos acreditam que o multiverso foi trazido à existência pela palavra falada e que vestígios de suas Palavras da Criação ainda ressoam e cintilam em todos os planos de existência. A magia bárdica busca canalizar essas palavras, que transcendem qualquer idioma.</p><p>Qualquer coisa pode inspirar uma nova canção ou conto; por isso, os bardos fascinam-se por quase tudo. Eles se tornam mestres em diversas áreas, incluindo a execução musical, a prática de magia e a arte de fazer graça.</p><p>A vida de um bardo é dedicada a viajar, reunir conhecimentos, contar histórias e viver da gratidão do público, tal como qualquer outro artista. No entanto, a profundidade de seu conhecimento e o domínio da magia são o que os diferencia.</p>",
        "cleric": "<p>Clérigos extraem poder dos domínios dos deuses e o canalizam para realizar milagres. Abençoado por uma divindade, um panteão ou outra entidade imortal, um Clérigo pode acessar a magia divina dos Planos Exteriores — onde habitam os deuses — e canalizá-la para fortalecer aliados e combater inimigos.</p><p>Como seu poder é uma dádiva divina, os Clérigos geralmente se associam a templos dedicados à divindade ou outra força imortal que despertou sua magia. Canalizar magia divina não exige um treinamento específico; no entanto, Clérigos podem aprender orações e ritos que os auxiliam a extrair poder dos Planos Exteriores.</p><p>Nem todo membro de um templo ou santuário é um Clérigo. Alguns sacerdotes são chamados para uma vida simples de serviço ao templo, expressando sua devoção por meio de orações e rituais, e não de magia. Muitos mortais afirmam falar em nome dos deuses, mas poucos conseguem canalizar o poder dessas divindades da maneira que um Clérigo consegue.</p>",
        "druid": "<p>Os druidas pertencem a ordens antigas que invocam as forças da natureza. Ao canalizar a magia de animais, plantas e dos quatro elementos, os druidas curam, transformam-se em animais e manipulam a destruição elemental.</p><p>Cultuando a natureza acima de tudo, cada druida obtém sua magia da própria natureza, de uma divindade da natureza ou de ambas as fontes; eles geralmente se unem a outros druidas para realizar rituais que marcam a passagem das estações e outros ciclos naturais.</p><p>Os druidas preocupam-se com o delicado equilíbrio ecológico que sustenta a vida vegetal e animal, bem como com a necessidade de as pessoas viverem em harmonia com a natureza. Eles frequentemente protegem locais sagrados ou vigiam regiões de natureza intocada, mas, quando surge um perigo significativo, assumem um papel mais ativo como aventureiros para combater a ameaça.</p>",
        "fighter": "<p>Guerreiros dominam muitos campos de batalha. Cavaleiros em busca de aventuras, campeões reais, soldados de elite e mercenários veteranos — como Guerreiros, todos compartilham uma maestria inigualável no uso de armas e armaduras. Além disso, estão muito familiarizados com a morte, tanto ao infligi-la quanto ao desafiá-la.</p><p>Guerreiros dominam diversas técnicas de combate, e um Guerreiro bem equipado sempre tem a ferramenta certa à mão para qualquer situação de luta. Da mesma forma, o Guerreiro tem grande aptidão para o uso de qualquer tipo de armadura. Além dessa familiaridade básica, cada Guerreiro se especializa em estilos de combate específicos. Alguns se concentram no arco e flecha, outros no combate com duas armas simultâneas e há aqueles que aprimoram suas habilidades marciais com magia. Essa combinação de versatilidade e especialização profunda torna os Guerreiros combatentes superiores.</p>",
        "monk": "<p>Monges utilizam treinamento de combate rigoroso e disciplina mental para se alinharem ao multiverso e concentrarem suas reservas internas de poder. Diferentes monges conceituam esse poder de várias maneiras: como sopro, energia, força vital, essência ou o próprio eu, por exemplo. Seja canalizado como uma demonstração impressionante de proeza marcial ou como uma manifestação mais sutil de defesa e velocidade, esse poder permeia tudo o que um monge faz.</p><p>Monges concentram seu poder interno para criar efeitos extraordinários, ou até mesmo sobrenaturais. Eles canalizam velocidade e força impressionantes em seus ataques, com ou sem o uso de armas. Nas mãos de um monge, até mesmo as armas mais simples podem se tornar instrumentos sofisticados de maestria em combate.</p><p>Muitos monges descobrem que uma vida estruturada de isolamento ascético os ajuda a cultivar o foco físico e mental necessário para canalizar seu poder. Outros monges acreditam que mergulhar na agitação vibrante da vida ajuda a alimentar sua determinação e disciplina.</p><p>Monges geralmente encaram aventuras como testes de seu desenvolvimento físico e mental. Eles são impulsionados pelo desejo de realizar uma missão maior do que simplesmente derrotar monstros e saquear tesouros; eles se empenham em transformar a si mesmos em armas vivas.</p>",
        "paladin": "<p>Os paladinos estão unidos por seus juramentos de enfrentar as forças da aniquilação e da corrupção. Seja proferido diante do altar de uma divindade, em uma clareira sagrada perante espíritos da natureza ou em um momento de desespero e pesar tendo apenas os mortos como testemunhas, o juramento de um paladino é um vínculo poderoso. É uma fonte de poder que transforma um guerreiro devoto em um campeão abençoado.</p><p>Os paladinos treinam para adquirir habilidades de combate, dominando uma variedade de armas e armaduras. Ainda assim, suas habilidades marciais são secundárias em relação ao poder mágico que exercem: o poder de curar os feridos, golpear seus inimigos e proteger os indefesos e aqueles que lutam ao seu lado.</p><p>Quase por definição, a vida de um paladino é uma vida de aventuras, pois todo paladino vive na linha de frente da luta cósmica contra a aniquilação. Guerreiros já são raros nas fileiras dos exércitos de um mundo, mas ainda menos pessoas podem reivindicar o chamado de um paladino. Quando recebem esse chamado, essas pessoas abençoadas abandonam suas ocupações anteriores e assumem as armas e a magia.</p>",
        "ranger": "<p>Longe das cidades agitadas, entre as árvores de florestas virgens e através de vastas planícies, os Patrulheiros mantêm sua vigília incessante na natureza selvagem. Eles aprendem a rastrear sua presa como um predador, movendo-se furtivamente pela mata e ocultando-se entre a vegetação e os escombros.</p><p>Graças à sua conexão com a natureza, os Patrulheiros também podem conjurar magias que canalizam os poderes primordiais do mundo selvagem. Os talentos e a magia do Patrulheiro são aprimorados com um foco letal para proteger o mundo das devastações causadas por monstros e tiranos.</p>",
        "rogue": "<p>Ladinos valem-se da astúcia, da furtividade e das vulnerabilidades de seus oponentes para obter vantagem em qualquer situação. Eles possuem um talento natural para encontrar a solução de praticamente qualquer problema. Alguns chegam a aprender truques mágicos para complementar suas outras habilidades. Muitos Ladinos concentram-se na furtividade e no logro, enquanto outros aprimoram perícias úteis em masmorras, como escalar, localizar e desarmar armadilhas e abrir fechaduras.</p><p>Em combate, os Ladinos priorizam golpes sutis em detrimento da força bruta. Eles preferem desferir um único golpe preciso a desgastar o oponente com uma enxurrada de ataques.</p><p>Alguns Ladinos iniciaram suas carreiras como criminosos, ao passo que outros empregaram sua astúcia no combate ao crime. Independentemente da relação que um Ladino tenha com a lei, nenhum criminoso comum ou agente da lei consegue se equiparar à genialidade sutil dos maiores Ladinos.</p>",
        "sorcerer": "<p>Feiticeiros manejam uma magia inata, gravada em seu próprio ser. Alguns não sabem dizer qual é a origem de seu poder, enquanto outros a associam a eventos estranhos em sua história pessoal ou familiar. A bênção de um dragão ou de uma dríade no nascimento de um bebê, ou a queda de um raio vindo de um céu sem nuvens, pode despertar o dom de um Feiticeiro. O mesmo pode ocorrer com a dádiva de uma divindade, a exposição à magia estranha de outro plano de existência ou um vislumbre do funcionamento íntimo da realidade. Seja qual for a origem, o resultado é uma marca indelével no Feiticeiro: uma magia efervescente que pode ser transmitida através de gerações.</p><p>Feiticeiros não aprendem magia; o poder bruto e turbulento da magia faz parte deles. A arte essencial de um Feiticeiro consiste em aprender a dominar e canalizar essa magia inata, permitindo-lhe descobrir maneiras novas e impressionantes de liberar seu poder. À medida que dominam sua magia inata, os Feiticeiros tornam-se mais sintonizados com a origem dela, desenvolvendo poderes distintos que refletem essa fonte.</p><p>Feiticeiros são raros. Algumas linhagens familiares produzem exatamente um Feiticeiro a cada geração, mas, na maioria das vezes, os talentos de feitiçaria surgem ao acaso. Aqueles que possuem esse poder mágico logo descobrem que ele não gosta de permanecer quieto. A magia de um Feiticeiro anseia por ser utilizada.</p>",
        "warlock": "<p>Bruxos buscam o conhecimento oculto na própria trama do multiverso. Eles frequentemente iniciam sua busca por poder mágico debruçando-se sobre tomos de sabedoria proibida, aventurando-se em invocações destinadas a atrair o poder de seres extraplanares ou procurando locais de poder onde a influência desses seres possa ser sentida. Em pouco tempo, cada Bruxo é atraído para um pacto vinculativo com um patrono poderoso. Valendo-se do conhecimento ancestral de seres como anjos, arquifadas, demônios, diabos, bruxas e entidades alienígenas do Reino Distante, os Bruxos reúnem segredos arcanos para ampliar seu próprio poder.</p><p>Os Bruxos veem seus patronos como recursos, como meios para alcançar o objetivo de obter poder mágico. Alguns Bruxos respeitam, reverenciam ou até mesmo amam seus patronos; outros servem a eles a contragosto; e há aqueles que tentam minar seus patronos, mesmo enquanto exercem o poder que eles lhes concederam.</p><p>Uma vez firmado o pacto, a sede de conhecimento e poder do Bruxo não pode ser saciada apenas com estudos. A maioria dos Bruxos passa seus dias em busca de maior poder e conhecimento mais profundo, o que tipicamente envolve algum tipo de aventura.</p>",
        "wizard": "<p>Magos são definidos pelo estudo exaustivo dos mecanismos internos da magia. Eles lançam feitiços de fogo explosivo, relâmpagos em arco, ilusões sutis e transformações espetaculares. Sua magia conjura monstros de outros planos de existência, vislumbra o futuro ou cria barreiras protetoras. Seus feitiços mais poderosos transformam uma substância em outra, trazem meteoros do céu ou abrem portais para outros mundos.</p><p>A maioria dos Magos compartilha uma abordagem acadêmica em relação à magia. Eles examinam os fundamentos teóricos da magia, particularmente a categorização de feitiços em escolas de magia. Magos renomados, como Bigby, Tasha, Mordenkainen e Yolande, basearam-se em seus estudos para criar feitiços icônicos, hoje utilizados em todo o multiverso.</p><p>O mais próximo que um Mago costuma chegar de uma vida comum é trabalhando como sábio ou professor. Outros Magos vendem seus serviços como conselheiros, servem em forças militares ou dedicam-se a uma vida de crime ou dominação.</p><p>No entanto, o fascínio pelo conhecimento atrai até mesmo os Magos menos afeitos a aventuras, tirando-os da segurança de suas bibliotecas e laboratórios para explorar ruínas em ruínas e cidades perdidas. A maioria dos Magos acredita que seus equivalentes em civilizações antigas conheciam segredos mágicos perdidos com o passar do tempo, e que descobrir tais segredos poderia abrir caminho para um poder superior a qualquer magia disponível na era atual.</p>"
    };

    function displayClass(cls) {
        const proficiencies = cls.proficiencies.map(p => p.name).join(', ');
        const customDesc = classDescriptions[cls.index] || "<p>Nenhuma descrição disponível para esta classe ainda.</p>";
        const imgHtml = `<img src="assets/classes/${cls.index}.png" alt="${cls.name}" class="card-image" onerror="this.style.display='none'">`;
        
        resultContainer.innerHTML = `
            <h3>${cls.name}</h3>
            ${imgHtml}
            <p><strong>Dado de Vida (Hit Die):</strong> d${cls.hit_die}</p>
            <p><strong>Proficiências Iniciais:</strong> ${proficiencies}</p>
            <hr style="border: 0; border-top: 1px solid var(--primary-color); margin: 20px 0;">
            <div class="description">${customDesc}</div>
            <p style="margin-top:20px; font-size: 0.9em; opacity: 0.8">Para ver a progressão completa de níveis, equipamentos e subclasses, visite os registros completos do jogador.</p>
        `;
    }

    function displayRace(race) {
        const abilityBonuses = race.ability_bonuses ? race.ability_bonuses.map(ab => `+${ab.bonus} ${ab.ability_score.name}`).join(', ') : 'Nenhum';
        const languages = race.languages ? race.languages.map(l => l.name).join(', ') : 'Nenhum';
        const traits = race.traits && race.traits.length > 0 ? race.traits.map(t => t.name).join(', ') : 'Nenhum';
        
        const raceImages = {
            'dwarf': 'anao-dwarf.webp',
            'dragonborn': 'draconato-dragonborn.webp',
            'elf': 'elfo-elf.jpg',
            'gnome': 'gnomo.webp',
            'half-orc': 'half-orc--meio-orc.jpg',
            'halfling': 'halfling.png',
            'human': 'humano.jpg',
            'half-elf': 'meio-elfo--half-elf.webp',
            'tiefling': 'tiefling.jpg'
        };
        const imgFile = raceImages[race.index];
        const imgHtml = imgFile ? `<img src="assets/raças/${imgFile}" alt="${race.name}" class="card-image">` : '';

        resultContainer.innerHTML = `
            <h3>${race.name}</h3>
            ${imgHtml}
            <p><strong>Deslocamento (Speed):</strong> ${race.speed} ft.</p>
            <p><strong>Bônus de Atributos:</strong> ${abilityBonuses}</p>
            <p><strong>Tamanho:</strong> ${race.size} - ${race.size_description}</p>
            <p><strong>Tendência (Alignment):</strong> ${race.alignment}</p>
            <hr style="border: 0; border-top: 1px solid var(--primary-color); margin: 20px 0;">
            <p><strong>Idade:</strong> ${race.age}</p>
            <p><strong>Idiomas:</strong> ${languages}</p>
            <p><strong>Traços Raciais:</strong> ${traits}</p>
        `;
    }

    function displayMagicItem(item) {
        const rarity = item.rarity ? item.rarity.name : 'Desconhecida';
        const description = item.desc ? item.desc.map(d => `<p>${d}</p>`).join('') : '<p>Sem descrição disponível.</p>';
        const attunement = (item.requires_attunement === "requires attunement" || item.requires_attunement === true) ? 'Sim' : 'Não';
        
        resultContainer.innerHTML = `
            <h3>${item.name}</h3>
            <p><strong>Categoria:</strong> ${item.equipment_category ? item.equipment_category.name : 'Item Mágico'}</p>
            <p><strong>Raridade:</strong> ${rarity}</p>
            <p><strong>Requer Sintonia (Attunement):</strong> ${attunement}</p>
            <hr style="border: 0; border-top: 1px solid var(--primary-color); margin: 20px 0;">
            <div class="description">${description}</div>
        `;
    }

    function showResultError(message) {
        resultContainer.innerHTML = `<p style="color: #ff6b6b;"><strong>Atenção:</strong> ${message}</p>`;
    }

    // --- 6. CONTACT FORM, LOCAL STORAGE & VIACEP ---
    const guildForm = document.getElementById('guild-form');
    const formSuccess = document.getElementById('form-success');
    const nameInput = document.getElementById('name');

    // Integração ViaCEP
    const cepInput = document.getElementById('cep');
    const logradouroInput = document.getElementById('logradouro');
    const bairroInput = document.getElementById('bairro');
    const cidadeInput = document.getElementById('cidade');
    const estadoInput = document.getElementById('estado');

    if (cepInput) {
        cepInput.addEventListener('blur', async (e) => {
            let cep = e.target.value.replace(/\D/g, '');
            if (cep.length === 8) {
                try {
                    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                    const data = await response.json();
                    if (!data.erro) {
                        logradouroInput.value = data.logradouro;
                        bairroInput.value = data.bairro;
                        cidadeInput.value = data.localidade;
                        estadoInput.value = data.uf;
                    } else {
                        alert("CEP não encontrado nas terras conhecidas!");
                    }
                } catch (err) {
                    console.error("Erro ao buscar CEP:", err);
                }
            }
        });
    }

    guildForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Salva o nome no Local Storage
        const heroName = nameInput.value.trim();
        if (heroName) {
            localStorage.setItem('heroName', heroName);
        }
        
        guildForm.style.display = 'none';
        formSuccess.classList.remove('hidden');
    });
});
