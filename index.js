const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

// Middleware to parse form data & JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set EJS view engine
app.set("view engine", "ejs");

// Serve static files in /files so they can be downloaded
app.use("/files", express.static(path.join(__dirname, "files")));

// Helper to sanitize filename
function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9_\- ]/gi, "_"); // replace invalid characters
}

// Show home page (list files)
app.get("/", (req, res) => {
  const folderPath = path.join(__dirname, "files");

  fs.readdir(folderPath, (err, fileNames) => {
    if (err) {
      return res.render("index", { files: [] });
    }

    const files = fileNames.map(name => ({
      title: name,
      description: "Saved in /files folder",
      url: "/files/" + name
    }));

    res.render("index", { files });
  });
});

//read more button
    
    // Read a single note
app.get("/note/:filename", (req, res) => {
  const { filename } = req.params;

  const folderPath = path.join(__dirname, "files");
  const filePath = path.join(folderPath, filename);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Note not found");
  }

  // Read the file content
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).send("Error reading note");
    }

    // Render a template for the note
    res.render("note", {
      title: filename.replace(".txt", ""), // remove .txt for display
      content: data
    });
  });
});

//edit button
 // Edit note (rename)
app.get("/edit/:filename", (req, res) => {
  const { filename } = req.params;

  // Pass current filename to EJS
  res.render("edit", {
    currentName: filename.replace(".txt", ""), // pre-fill previous name
    filename: filename // needed for POST route
  });
});
app.post("/edit/:filename", (req, res) => {
  const { filename } = req.params;
  const { newName } = req.body;

  if (!newName) {
    return res.status(400).send("New name is required");
  }

  const folderPath = path.join(__dirname, "files");
  const oldFilePath = path.join(folderPath, filename);
  const safeNewName = sanitizeFilename(newName);
  const newFilePath = path.join(folderPath, `${safeNewName}.txt`);

  // Rename the file
  fs.rename(oldFilePath, newFilePath, (err) => {
    if (err) {
      console.error("Error renaming file:", err);
      return res.status(500).send("Error renaming file");
    }

    console.log(`File renamed: ${filename} → ${safeNewName}.txt`);
    res.redirect("/"); // go back to homepage
  });
});


// Handle form submit
app.post("/create", (req, res) => {
  console.log("Form data received:", req.body);

  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).send("Title and description are required");
  }

  const folderPath = path.join(__dirname, "files");

  // Ensure /files folder exists
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }

  const safeTitle = sanitizeFilename(title);
  const filePath = path.join(folderPath, `${safeTitle}.txt`);

  fs.writeFile(filePath, description, err => {
    if (err) {
      console.error("Error saving note:", err);
      return res.status(500).send("Error saving note");
    }

    console.log(`File created: ${filePath}`);
    res.redirect("/"); // refresh homepage
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
