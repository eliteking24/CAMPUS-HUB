// ===============================
// WAIT FOR PAGE TO LOAD
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
});


// ===============================
// LOAD ALL PRODUCTS (HOMEPAGE)
// ===============================
async function loadProducts() {
  try {
    if (!window.db) {
      console.log("DB not ready");
      return;
    }

    const { data, error } = await window.db
      .from("products")
      .select("*");

    if (error) {
      console.log("Fetch error:", error);
      return;
    }

    const container = document.getElementById("products");
    if (!container) return;

    container.innerHTML = "";

    if (!data || data.length === 0) {
      container.innerHTML = "<p>No products yet</p>";
      return;
    }

    data.forEach(item => {
      if (!item.listed) return;

      container.innerHTML += `
        <div class="card">
          <img src="${item.image || 'https://picsum.photos/200'}" width="100%">
          <h3>${item.name}</h3>
          <p>₦${item.price}</p>
          <small>${item.location || ''}</small>
        </div>
      `;
    });

  } catch (err) {
    console.log("Load error:", err);
  }
}


// ===============================
// POST ITEM
// ===============================
async function postItem() {
  try {
    const owner = document.getElementById("owner")?.value.trim();
    const contact = document.getElementById("contact")?.value.trim();
    const name = document.getElementById("name")?.value.trim();
    const price = document.getElementById("price")?.value;
    const location = document.getElementById("location")?.value.trim();
    const file = document.getElementById("image")?.files[0];

    if (!owner || !contact || !name || !price) {
      alert("Please fill all fields");
      return;
    }

    let imageUrl = "";

    // ===============================
    // UPLOAD IMAGE (OPTIONAL)
    // ===============================
    if (file) {
      const fileName = Date.now() + "-" + file.name;

      const { error: uploadError } = await window.db.storage
        .from("products")
        .upload(fileName, file);

      if (uploadError) {
        console.log("Upload error:", uploadError);
        alert("Image upload failed");
        return;
      }

      const { data } = window.db.storage
        .from("products")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    // ===============================
    // INSERT INTO DATABASE
    // ===============================
    const { error: insertError } = await window.db
      .from("products")
      .insert([{
        owner,
        contact,
        name,
        price,
        location,
        image: imageUrl,
        listed: true
      }]);

    if (insertError) {
      console.log("Insert error:", insertError);
      alert("Failed to post item");
      return;
    }

    alert("✅ Item posted successfully!");

    loadProducts();

  } catch (err) {
    console.log("Post error:", err);
    alert("Something went wrong");
  }
}


// ===============================
// LOAD USER ITEMS (DASHBOARD)
// ===============================
async function loadUserItems() {
  try {
    const owner = document.getElementById("ownerName")?.value.trim();
    const contact = document.getElementById("userContact")?.value.trim();

    if (!owner || !contact) {
      alert("Enter your name and phone");
      return;
    }

    const { data, error } = await window.db
      .from("products")
      .select("*")
      .eq("owner", owner)
      .eq("contact", contact);

    if (error) {
      console.log("Dashboard error:", error);
      return;
    }

    const container = document.getElementById("userProducts");
    if (!container) return;

    container.innerHTML = "";

    if (!data || data.length === 0) {
      container.innerHTML = "<p>No items found</p>";
      return;
    }

    data.forEach(item => {
      container.innerHTML += `
        <div class="card">
          <h3>${item.name}</h3>
          <p>₦${item.price}</p>

          <button onclick="toggleItem('${item.id}', ${item.listed})">
            ${item.listed ? "Unlist" : "List"}
          </button>
        </div>
      `;
    });

  } catch (err) {
    console.log("Dashboard load error:", err);
  }
}


// ===============================
// TOGGLE LIST / UNLIST
// ===============================
async function toggleItem(id, current) {
  try {
    const { error } = await window.db
      .from("products")
      .update({ listed: !current })
      .eq("id", id);

    if (error) {
      console.log("Toggle error:", error);
      return;
    }

    loadUserItems();
    loadProducts();

  } catch (err) {
    console.log("Toggle crash:", err);
  }
}