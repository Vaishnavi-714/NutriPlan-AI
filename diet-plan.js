const PLAN_PATIENTS = {
    '1': { initials: 'RS', name: 'Rajesh Sharma', meta: 'Male · 52 yrs · BMI 28.4', risk: 'High Risk' },
    '2': { initials: 'PM', name: 'Priya Mehta', meta: 'Female · 44 yrs · BMI 26.1', risk: 'Moderate Risk' },
    '3': { initials: 'AK', name: 'Amit Kumar', meta: 'Male · 36 yrs · BMI 23.7', risk: 'Low Risk' },
    '4': { initials: 'SG', name: 'Sunita Gupta', meta: 'Female · 59 yrs · BMI 30.2', risk: 'High Risk' },
    '5': { initials: 'VR', name: 'Vikram Rao', meta: 'Male · 40 yrs · BMI 24.9', risk: 'Pending Review' },
    '6': { initials: 'NK', name: 'Neha Kapoor', meta: 'Female · 31 yrs · BMI 27.3', risk: 'Moderate Risk' },
    '7': { initials: 'DP', name: 'Deepak Patel', meta: 'Male · 63 yrs · BMI 25.8', risk: 'Moderate Risk' }
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MEAL_COUNT_MAP = {
    3: ['Breakfast', 'Lunch', 'Dinner'],
    4: ['Breakfast', 'Lunch', 'Evening Snack', 'Dinner'],
    5: ['Early Morning', 'Breakfast', 'Lunch', 'Evening Snack', 'Dinner'],
    6: ['Early Morning', 'Breakfast', 'Mid-Morning', 'Lunch', 'Evening Snack', 'Dinner'],
    7: ['Early Morning', 'Breakfast', 'Mid-Morning', 'Lunch', 'Evening Snack', 'Dinner', 'Bedtime']
};

const MEAL_IMAGES = {
    'Early Morning': 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=900&q=80',
    Breakfast: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=900&q=80',
    'Mid-Morning': 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=900&q=80',
    Lunch: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=80',
    'Evening Snack': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80',
    Dinner: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80',
    Bedtime: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=80'
};

const planState = {
    activeDay: 'Monday',
    mealCount: 7
};

const MEALS = [
    {
        title: 'Early Morning', time: '6:30 AM', kcal: 95, thumb: 'water',
        summary: 'Hydration and gentle metabolic priming before breakfast.',
        foods: ['Warm water with soaked methi seeds', '4 soaked almonds + 1 walnut half'],
        portion: 'Small hydration-first starter',
        note: 'Supports morning hydration and gentle glucose control.',
        alternatives: ['Lemon water', 'Cinnamon water', 'Methi water']
    },
    {
        title: 'Breakfast', time: '8:00 AM', kcal: 420, thumb: 'breakfast',
        summary: 'Protein-forward Indian breakfast with low glycemic load.',
        foods: ['Moong dal chilla, 2 pieces', 'Mint chutney, no sugar', 'Green tea'],
        portion: '2 chilla + 1 small chutney bowl',
        note: 'High protein, low GI breakfast for sustained satiety.',
        alternatives: ['Poha / upma', 'Oats dosa / besan chilla', '1 roti / 1 paratha']
    },
    {
        title: 'Mid-Morning', time: '10:45 AM', kcal: 145, thumb: 'snack',
        summary: 'Small fiber snack to prevent long fasting gaps.',
        foods: ['1 guava or small apple', 'Roasted chana, 20g'],
        portion: '1 fruit + one small fist chana',
        note: 'Low GI snack avoids long fasting window before lunch.',
        alternatives: ['Papaya / apple', 'Buttermilk / curd', 'Nuts / seeds']
    },
    {
        title: 'Lunch', time: '1:15 PM', kcal: 505, thumb: 'lunch',
        summary: 'Balanced thali pattern with controlled grains and sodium.',
        foods: ['1 jowar roti + 1 multigrain roti', 'Moong dal, low salt', 'Lauki sabzi, low oil', 'Cucumber salad'],
        portion: '2 rotis + 1 bowl dal + 1 bowl sabzi',
        note: 'Balanced thali structure with fiber, protein, and sodium control.',
        alternatives: ['Rice / millet', 'Dal / paneer', 'Curd / buttermilk']
    },
    {
        title: 'Evening Snack', time: '5:00 PM', kcal: 175, thumb: 'snack',
        summary: 'Light snack to reduce late evening cravings.',
        foods: ['Unsweetened green tea', 'Multigrain khakhra', 'Small sprout salad'],
        portion: '1 khakhra + 1 small salad bowl',
        note: 'Prevents late evening hunger without adding refined carbs.',
        alternatives: ['Fruit / nuts', 'Sprouts / chana', 'Soup / buttermilk']
    },
    {
        title: 'Dinner', time: '8:00 PM', kcal: 385, thumb: 'dinner',
        summary: 'Lower-carb dinner with vegetables and controlled protein.',
        foods: ['1 small multigrain roti', 'Palak sabzi, no cream', 'Clear vegetable soup', 'Grilled paneer, 50g'],
        portion: 'Light plate, half vegetables',
        note: 'Lower-carb dinner with protein support and heart-healthy preparation.',
        alternatives: ['Dal / paneer', 'Soup / salad', 'Roti / millet bhakri']
    },
    {
        title: 'Bedtime', time: '10:00 PM', kcal: 90, thumb: 'water',
        summary: 'Optional bedtime support for satiety and digestion.',
        foods: ['Warm turmeric milk, low fat, no sugar', 'Isabgol in water if needed'],
        portion: '1 small glass',
        note: 'Supports satiety and digestive regularity without sugar load.',
        alternatives: ['Milk / buttermilk', 'Herbal tea', 'Plain warm water']
    }
];

function initPlanPage() {
    const params = new URLSearchParams(window.location.search);
    const patient = PLAN_PATIENTS[params.get('patientId') || params.get('patient') || '1'] || PLAN_PATIENTS['1'];
    document.getElementById('planAvatar').textContent = patient.initials;
    document.getElementById('planPatientName').textContent = patient.name;
    document.getElementById('planPatientMeta').textContent = patient.meta;
    document.querySelector('.plan-risk-chip').textContent = patient.risk;
    renderTabs();
    renderMeals(planState.activeDay);
    document.getElementById('mealCountSelect').addEventListener('change', handleMealCountChange);
    document.getElementById('approvePlanBtn').addEventListener('click', approvePlan);
    document.getElementById('exportPlanBtn').addEventListener('click', flashExport);
}

function renderTabs() {
    const tabs = document.getElementById('planDayTabs');
    tabs.innerHTML = DAYS.map((day, index) => `
        <button class="plan-day-tab${index === 0 ? ' active' : ''}" data-day="${day}">
            <strong>${day}</strong>
            <span>Day ${index + 1}</span>
        </button>
    `).join('');
    tabs.querySelectorAll('.plan-day-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.querySelectorAll('.plan-day-tab').forEach(item => item.classList.remove('active'));
            tab.classList.add('active');
            planState.activeDay = tab.dataset.day;
            renderMeals(planState.activeDay);
        });
    });
}

function handleMealCountChange(e) {
    planState.mealCount = Number(e.target.value);
    e.target.closest('.meal-count-control').classList.add('has-feedback');
    setTimeout(() => e.target.closest('.meal-count-control')?.classList.remove('has-feedback'), 280);
    renderMeals(planState.activeDay);
}

function getVisibleMeals() {
    const allowed = MEAL_COUNT_MAP[planState.mealCount] || MEAL_COUNT_MAP[7];
    return MEALS.filter(meal => allowed.includes(meal.title));
}

function renderMeals(day) {
    document.getElementById('activeDayName').textContent = day;
    const grid = document.getElementById('mealCardGrid');
    grid.classList.add('is-switching');
    setTimeout(() => {
        grid.innerHTML = getVisibleMeals().map((meal, index) => createMealCard(meal, index)).join('');
        grid.querySelectorAll('.meal-edit-btn').forEach(button => {
            button.addEventListener('click', () => {
                const card = button.closest('.meal-card');
                card.classList.toggle('is-editing');
                card.querySelectorAll('.food-line').forEach(line => {
                    line.contentEditable = card.classList.contains('is-editing') ? 'true' : 'false';
                });
                button.textContent = card.classList.contains('is-editing') ? 'Done' : 'Edit';
            });
        });
        grid.querySelectorAll('.meal-swap-btn').forEach(button => {
            button.addEventListener('click', () => {
                const card = button.closest('.meal-card');
                const alternatives = card.querySelector('.alternative-block');
                alternatives.classList.toggle('is-highlighted');
                button.textContent = alternatives.classList.contains('is-highlighted') ? 'Review choices' : 'Suggest swap';
            });
        });
        grid.classList.remove('is-switching');
    }, 130);
}

function createMealCard(meal, index = 0) {
    const imageUrl = MEAL_IMAGES[meal.title] || MEAL_IMAGES.Breakfast;
    return `
        <article class="meal-card" style="--card-delay:${index * 45}ms">
            <div class="meal-image ${meal.thumb}" style="background-image: linear-gradient(180deg, rgba(19, 34, 51, 0.02), rgba(19, 34, 51, 0.28)), url('${imageUrl}')" aria-hidden="true">
                <span class="meal-image-label">${meal.title}</span>
                <span class="meal-image-kcal">${meal.kcal} kcal</span>
            </div>
            <div class="meal-card-top">
                <div>
                    <h3>${meal.title}</h3>
                    <div class="meal-meta"><span>${meal.time}</span><span>${meal.kcal} kcal</span><span>${meal.portion}</span></div>
                    <p class="meal-summary">${meal.summary}</p>
                </div>
                <button class="meal-edit-btn">Edit</button>
            </div>
            <div class="meal-card-body">
                <div class="meal-card-tags">
                    <span>Doctor editable</span>
                    <span>${meal.kcal} kcal</span>
                    <span>Clinical note</span>
                </div>
                <span class="meal-card-subhead">Primary recommendation</span>
                <div class="food-list">
                    ${meal.foods.map(food => `<div class="food-line">${food}</div>`).join('')}
                </div>
                <div class="food-portion">Portion guidance: ${meal.portion}</div>
                <div class="meal-note">${meal.note}</div>
                <div class="alternative-block">
                    <span>Alternative choices</span>
                    <div class="alternative-row">
                        ${meal.alternatives.map(item => `<button class="alternative-chip">${item}</button>`).join('')}
                    </div>
                </div>
                <button class="meal-swap-btn" type="button">Suggest swap</button>
            </div>
        </article>
    `;
}

function approvePlan() {
    const btn = document.getElementById('approvePlanBtn');
    btn.textContent = 'Approved';
    btn.style.background = '#43AFA3';
    btn.classList.add('is-confirmed');
}

function flashExport() {
    const btn = document.getElementById('exportPlanBtn');
    const original = btn.textContent;
    btn.textContent = 'Export ready';
    btn.classList.add('is-exporting');
    setTimeout(() => { btn.classList.remove('is-exporting'); }, 420);
    setTimeout(() => { btn.textContent = original; }, 1600);
}

initPlanPage();
