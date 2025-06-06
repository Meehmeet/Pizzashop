const apiResponse = [
    {
        name: "Margherita",
        ingredients: ["Tomate", "Mozzarella", "Basilikum"]
    },
    {
        name: "Salami",
        ingredients: ["Tomate", "Mozzarella", "Salami"]
    },
    {
        name: "Funghi",
        ingredients: ["Tomate", "Mozzarella", "Champignons"]
    }
];

// AJV Schema für Validierung
const schema = {
    type: "array",
    items: {
        type: "object",
        required: ["name", "ingredients"],
        properties: {
            name: { type: "string" },
            ingredients: {
                type: "array",
                items: { type: "string" }
            }
        }
    }
};

const ajv = new Ajv();
const validate = ajv.compile(schema);

function renderPizzas(pizzas) {
    const container = document.getElementById("pizzas");
    container.innerHTML = "";

    pizzas.forEach(pizza => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
      <h3>${pizza.name}</h3>
      <ul>${pizza.ingredients.map(i => `<li>${i}</li>`).join("")}</ul>
      <button onclick="orderPizza('${pizza.name}')">Jetzt bestellen</button>
    `;

        container.appendChild(card);
    });
}

function orderPizza(name) {
    alert(`🍕 Deine ${name} Pizza wurde zur Abholung bestellt!`);
}

// Simulierte API-Verarbeitung
function init() {
    if (validate(apiResponse)) {
        renderPizzas(apiResponse);
    } else {
        console.error("Ungültige Daten", validate.errors);
        document.getElementById("pizzas").innerHTML = "<p>Fehler beim Laden der Pizzen.</p>";
    }
}

init();
