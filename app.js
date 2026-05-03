// =====================
// LOAD PRODUCTS TO HOME
// =====================
async function loadProducts() {
  const { data, error } = await window.db.from("products").select("*");

  if (error) {
    console.log(error);
    return;
  }

  let container = document.getElementById("products");
  if (!container) return;

  container.innerHTML = "";

  data.forEach(item => {
    if (!item.listed) return;

    container.innerHTML += `
      <div class="card">
        <img src="${item.image}">
        <h3>${item.name}</h3>
        <p>₦${item.price}</p>
        <p>📍 ${item.location}</p>
        <small>Seller: ${item.owner}</small>
      </div>
    `;
  });
}

loadProducts();


// =====================
// POST ITEM
// =====================
async function postItem() {
  try {
    let owner = document.getElementById("owner").value.trim();
    let contact = document.getElementById("contact").value.trim();
    let name = document.getElementById("name").value.trim();
    let price = document.getElementById("price").value;
    let location = document.getElementById("location").value.trim();
    let file = document.getElementById("image").files[0];

    if (!owner || !contact || !name || !price || !file) {
      alert("Fill all fields!");
      return;
    }

    let fileName = Date.now() + "-" + file.name;

    // upload image
    const { error: uploadError } = await window.db.storage
      .from("products")
      .upload(fileName, file);

    if (uploadError) {
      console.log(uploadError);
      alert("Image upload failed");
      return;
    }

    // get url
    const { data: urlData } = window.db.storage
      .from("products")
      .getPublicUrl(fileName);

    // insert into DB
    const { error: dbError } = await window.db.from("products").insert([
      {
        owner,
        contact,
        name,
        price,
        location,
        image: urlData.publicUrl,
        listed: true
      }
    ]);

    if (dbError) {
      console.log(dbError);
      alert("Failed to post item");
      return;
    }

    // SUCCESS POPUP
    document.getElementById("popup").style.display = "block";

    // redirect
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);

  } catch (err) {
    console.log(err);
  }
}


// =====================
// LOAD USER ITEMS
// =====================
async function loadUserItems() {
  let owner = document.getElementById("ownerName").value.trim();
  let contact = document.getElementById("userContact").value.trim();

  if (!owner || !contact) {
    alert("Enter name and phone");
    return;
  }

  const { data, error } = await window.db
    .from("products")
    .select("*")
    .eq("owner", owner)
    .eq("contact", contact);

  if (error) {
    console.log(error);
    return;
  }

  let container = document.getElementById("userProducts");
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = "<p>No items found</p>";
    return;
  }

  data.forEach(item => {
    container.innerHTML += `
      <div class="card">
        <img src="${item.image}">
        <h3>${item.name}</h3>
        <p>₦${item.price}</p>

        <button onclick="toggleItem('${item.id}', ${item.listed})">
          ${item.listed ? "Unlist" : "List"}
        </button>
      </div>
    `;
  });
}


// =====================
// TOGGLE LIST / UNLIST
// =====================
async function toggleItem(id, current) {
  await window.db
    .from("products")
    .update({ listed: !current })
    .eq("id", id);

  loadUserItems();
}