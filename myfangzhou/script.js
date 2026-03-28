const countdownEl = document.getElementById("countdown");
const planSelect = document.getElementById("planSelect");
const orderPrice = document.getElementById("orderPrice");
const form = document.getElementById("orderForm");
const message = document.getElementById("formMessage");
const planButtons = document.querySelectorAll(".select-plan");

function updatePrice() {
  const [, price] = planSelect.value.split("|");
  const formatted = Number(price).toLocaleString("zh-CN");
  orderPrice.textContent = `¥${formatted}`;
}

planSelect.addEventListener("change", updatePrice);

planButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const name = button.dataset.name;
    const price = button.dataset.price;
    planSelect.value = `${name}|${price}`;
    updatePrice();
    document.getElementById("buy").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const city = String(formData.get("city") || "").trim();

  if (!/^1[3-9]\d{9}$/.test(phone)) {
    message.textContent = "手机号格式不正确，请检查后重试。";
    message.style.color = "#b43a2c";
    return;
  }

  if (!name || !city) {
    message.textContent = "请完整填写姓名和城市。";
    message.style.color = "#b43a2c";
    return;
  }

  message.textContent = "提交成功，客服将在 10 分钟内联系您确认订单。";
  message.style.color = "#1f7a59";
  form.reset();
  planSelect.value = "家庭标准版|1699";
  updatePrice();
});

let remainingSeconds = 24 * 60 * 60 - 1;
setInterval(() => {
  const h = String(Math.floor(remainingSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(remainingSeconds % 60).padStart(2, "0");
  countdownEl.textContent = `${h}:${m}:${s}`;
  remainingSeconds = remainingSeconds > 0 ? remainingSeconds - 1 : 24 * 60 * 60 - 1;
}, 1000);

updatePrice();
