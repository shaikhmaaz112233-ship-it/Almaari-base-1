// Direct Connection API client for Almaari
async function request(path, options = {}) {
  const token = localStorage.getItem("almaari_token");

  options.headers = {
    ...options.headers,
    ...(token ? { "Authorization": token } : {})
  };

  try {
    const res = await fetch(`http://127.0.0.1:8000${path}`, options);
    return res;
  } catch (err) {
    console.error("Backend connection failed:", err);
    throw err;
  }
}

export async function loginUser(username, password) {
  const res = await request("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  
  const data = await res.json();
  if (res.ok && data.token) {
    localStorage.setItem("almaari_token", data.token);
  }
  
  return {
    ok: res.ok,
    status: res.status,
    json: async () => data
  };
}

export async function getDocuments() {
  const res = await request("/documents");
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to retrieve documents from the cupboard.");
  }
  return data;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await request("/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to file document away.");
  }
  return data;
}

export async function deleteDocument(docId) {
  const res = await request(`/documents/${docId}`, {
    method: "DELETE",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Failed to remove document.");
  }
  return data;
}

export async function askQuestion(question) {
  const res = await request("/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Error consulting the documents.");
  }
  return data;
}
