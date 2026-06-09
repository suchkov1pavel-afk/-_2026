const form = document.getElementById('registrationForm');
const childrenCount = document.getElementById('childrenCount');
const childrenFields = document.getElementById('childrenFields');
const formMessage = document.getElementById('formMessage');
const cityInput = document.getElementById('city');
const churchInput = document.getElementById('church');
const parentPhone = document.getElementById('parentPhone');

function makeOtherEditable(input, placeholder) {
  if (input.value.trim().toLowerCase() === 'другое') {
    input.value = '';
    input.placeholder = placeholder;
    setTimeout(() => input.focus(), 0);
  }
}

function normalizeRussianPhone() {
  const digits = parentPhone.value.replace(/\D/g, '');
  let rest = digits;

  if (rest.startsWith('7') || rest.startsWith('8')) {
    rest = rest.slice(1);
  }

  parentPhone.value = '+7' + rest.slice(0, 10);
}

function renderChildrenFields() {
  const count = Number(childrenCount.value || 1);
  childrenFields.innerHTML = '';

  for (let i = 1; i <= count; i++) {
    const card = document.createElement('div');
    card.className = 'child-card';
    card.innerHTML = `
      <p class="child-title">Ребёнок ${i}</p>
      <div class="field-row">
        <label>
          ФИО ребёнка <span>*</span>
          <input type="text" name="childName" placeholder="Фамилия Имя Отчество" required />
        </label>
        <label>
          Возраст ребёнка <span>*</span>
          <input type="number" name="childAge" min="5" max="14" placeholder="От 5 до 14" required />
        </label>
      </div>
    `;
    childrenFields.appendChild(card);
  }
}

function validateFormBeforeSend() {
  normalizeRussianPhone();
  makeOtherEditable(cityInput, 'Введите свой город');
  makeOtherEditable(churchInput, 'Введите название церкви');

  if (!form.checkValidity()) {
    form.reportValidity();
    return false;
  }

  const count = Number(childrenCount.value);
  if (!count || count < 1 || count > 7) {
    formMessage.textContent = 'За одну регистрацию можно указать от 1 до 7 детей.';
    formMessage.className = 'form-message error';
    return false;
  }

  if (!/^\+7\d{10}$/.test(parentPhone.value)) {
    parentPhone.setCustomValidity('Введите номер в формате +7XXXXXXXXXX');
    parentPhone.reportValidity();
    parentPhone.setCustomValidity('');
    return false;
  }

  const ages = [...form.querySelectorAll('input[name="childAge"]')].map((input) => Number(input.value));
  const invalidAge = ages.some((age) => age < 5 || age > 14);
  if (invalidAge) {
    formMessage.textContent = 'Возраст ребёнка должен быть от 5 до 14 лет включительно.';
    formMessage.className = 'form-message error';
    return false;
  }

  return true;
}

cityInput.addEventListener('input', () => makeOtherEditable(cityInput, 'Введите свой город'));
churchInput.addEventListener('input', () => makeOtherEditable(churchInput, 'Введите название церкви'));
childrenCount.addEventListener('change', renderChildrenFields);
parentPhone.addEventListener('input', normalizeRussianPhone);
parentPhone.addEventListener('blur', normalizeRussianPhone);

renderChildrenFields();
normalizeRussianPhone();

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!validateFormBeforeSend()) return;

  const scriptUrl = window.GOOGLE_SCRIPT_URL;
  if (!scriptUrl || scriptUrl.includes('PASTE_GOOGLE_APPS_SCRIPT_URL_HERE')) {
    formMessage.textContent = 'Сначала вставьте ссылку Google Apps Script в файл public/settings.js';
    formMessage.className = 'form-message error';
    return;
  }

  formMessage.textContent = 'Отправляем заявку...';
  formMessage.className = 'form-message';

  const data = new URLSearchParams(new FormData(form));
  data.set('submittedAt', new Date().toLocaleString('ru-RU'));

  try {
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      body: data
    });

    formMessage.textContent = 'Спасибо! Ваша заявка на регистрацию принята.';
    formMessage.className = 'form-message success';
    form.reset();
    cityInput.value = 'Саратов';
    churchInput.value = 'на Вокзальной';
    parentPhone.value = '+7';
    renderChildrenFields();
  } catch (error) {
    formMessage.textContent = 'Не удалось отправить заявку. Проверьте интернет и ссылку Google Apps Script.';
    formMessage.className = 'form-message error';
  }
});
