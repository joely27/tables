document.addEventListener('DOMContentLoaded', function() {
  const parentDiv = document.getElementById('gridContainer'); // Get the parent div

  if (parentDiv) {
    const childDivs = parentDiv.querySelectorAll('.item'); // Get all child divs
    let imagesCount = 0; // Change variable name to imagesCount
    let allImagesLoaded = false;

    for (let i = 0; i < childDivs.length; i++) {
      const childDiv = childDivs[i];
      childDiv.style.marginBottom = '20px'; // Add a 20px bottom margin to each child div

      // Check if the child div contains an image
      const image = childDiv.querySelector('img');
      if (image) {
        image.addEventListener('load', function() {
          imagesCount++; // Change variable name to imagesCount

          // Check if all images have finished loading
          if (imagesCount === childDivs.length) { // Change variable name to imagesCount
            allImagesLoaded = true;
            initializeMasonry(); // Call the function after all images have loaded
          }
        });
      } else {
        imagesCount++; // Change variable name to imagesCount

        // Check if all images have finished loading
        if (imagesCount === childDivs.length) { // Change variable name to imagesCount
          allImagesLoaded = true;
          initializeMasonry(); // Call the function if there are no images to load
        }
      }
    }

    // Use the imagesLoaded library to detect when all images have finished loading
    imagesLoaded(parentDiv, function() { // Change function name to avoid conflicts
      if (!allImagesLoaded) {
        initializeMasonry(); // Call the function after all images have loaded (additional delay)
      }
    });
  }
});

function initializeMasonry() {
  setTimeout(function() {
    const gridContainer = document.getElementById("gridContainer");
    const masonry = new Masonry(gridContainer, {
      itemSelector: ".item",
      gutter: 30, // Set the desired gap between grid items
      percentPosition: true
    });

    // Show the grid and grid items
    gridContainer.style.visibility = "visible";
    const items = document.getElementsByClassName("item");
    for (let i = 0; i < items.length; i++) {
      items[i].style.opacity = "1";
    }
  }, 1000); // Delay Masonry initialization by 1 second
}

// Your Airtable configuration and data fetching code
const base = "app1Z4C0dO7ufbxUS";
const table = "tblGBDKi3iFTW5GT2";
const apiKey = "patKNF8F1xv6adKyZ.7a5269c2c65164ef8233b6e7c3b3d9f977ae7e9e7c65182d87827db1ead9fa12";
const desiredFields = "Work,Name, Notes, Website, Category, Instagram";

// Fetch Airtable schema to get fields information
const metaUrl = `https://api.airtable.com/v0/meta/bases/${base}/tables`;
const metaHeaders = { Authorization: `Bearer ${apiKey}` };

fetch(metaUrl, { headers: metaHeaders })
  .then(response => response.json())
  .then(meta => {
    const tableMeta = meta.tables.find(t => t.id === table);

    if (!tableMeta) {
      throw new Error("Table not found in the schema.");
    }

    const fieldsSchema = {};
    tableMeta.fields.forEach(field => {
      fieldsSchema[field.name] = field.type;
    });

    // Split desired fields into an array
    const desiredFieldsArray = desiredFields.split(",").map(field => field.trim());

    // Fetch data from Airtable
    const view = "viwZ36CXYDIDlsBBe";
    const pageSize = 16; // Number of records per page
    let offset = ''; // Offset for pagination

    const loadMoreButton = document.getElementById('loadMoreButton');
    loadMoreButton.addEventListener('click', loadMoreRecords);

    function loadMoreRecords() {
      loadMoreButton.disabled = true; // Disable the button while loading more records

      const dataUrl = `https://api.airtable.com/v0/${base}/${table}?view=${view}&offset=${offset}&pageSize=${pageSize}`;
      fetch(dataUrl, { headers: { Authorization: `Bearer ${apiKey}` } })
        .then(response => response.json())
        .then(data => {
          const records = data.records;

          // Generate grid items using records data
          const gridContainer = document.getElementById("gridContainer");
          const recordsList = records.map(record => {
            const fields = desiredFieldsArray.map(field => {
              const fieldValue = record.fields[field];
              const fieldType = fieldsSchema[field];
              if (fieldType === "multipleAttachments") {
                return fieldValue?.[0]?.thumbnails?.large?.url || "";
              }
              return fieldValue || "";
            });
            return fields;
          });

          recordsList.forEach(recordFields => {
            const item = document.createElement("div");
            item.className = "item";

            // Fetch and add image to the item div
            const imageSrc = recordFields[0];
            if (imageSrc !== "") {
              const img = document.createElement("img");
              img.src = imageSrc.trim();
              item.appendChild(img);
            }

            const cardBody = document.createElement("div");
            cardBody.className = "card-body";

            recordFields.slice(1).forEach((fieldValue, index) => {
              const fieldName = desiredFieldsArray[index + 1];
              const fieldType = fieldsSchema[fieldName];
              const fieldDiv = document.createElement("div");
              fieldDiv.id = `${fieldName}--${fieldType}`;

              if (fieldType === "multipleSelects" || fieldType === "singleSelect") {
                let valuesArray = fieldValue;
                if (typeof fieldValue === "string") {
                  valuesArray = fieldValue.split(",");
                }

                const listContainer = document.createElement("ul");
                listContainer.className = "multipleSelects";

                valuesArray.forEach(value => {
                  const listItem = document.createElement("li");
                  listItem.textContent = value.trim();
                  listContainer.appendChild(listItem);
                });

                fieldDiv.appendChild(listContainer);
              } else {
                fieldDiv.textContent = fieldValue;
              }

              cardBody.appendChild(fieldDiv);

              // Add spacer div after each field
              if (index < desiredFieldsArray.length - 2) {
                const spacerDiv = document.createElement("div");
                spacerDiv.className = "spacer";
                cardBody.appendChild(spacerDiv);
              }
            });

            item.appendChild(cardBody);
            gridContainer.appendChild(item);
          });

          // Initialize Masonry after the grid items are added to the DOM
          initializeMasonry();

          // Enable the button and update the offset for the next page
          loadMoreButton.disabled = false;
          offset = data.offset || '';

          // Show or hide the "Load More" button based on the number of records
          if (offset >= data.totalRecords) {
            loadMoreButton.style.display = 'none';
          } else {
            loadMoreButton.style.display = 'block';
          }
        })
        .catch(error => console.error(error.message));
    }

    function fetchInitialRecords() {
      const dataUrl = `https://api.airtable.com/v0/${base}/${table}?view=${view}&offset=${offset}&pageSize=${pageSize}`;
      fetch(dataUrl, { headers: { Authorization: `Bearer ${apiKey}` } })
        .then(response => response.json())
        .then(data => {
          const records = data.records;

          // Clear the existing grid items before generating new ones
          const gridContainer = document.getElementById("gridContainer");
          gridContainer.innerHTML = '';

          // Generate grid items using records data
          const recordsList = records.map(record => {
            const fields = desiredFieldsArray.map(field => {
              const fieldValue = record.fields[field];
              const fieldType = fieldsSchema[field];
              if (fieldType === "multipleAttachments") {
                return fieldValue?.[0]?.thumbnails?.large?.url || "";
              }
              return fieldValue || "";
            });
            return fields;
          });

          recordsList.forEach(recordFields => {
            const item = document.createElement("div");
            item.className = "item";

            // Fetch and add image to the item div
            const imageSrc = recordFields[0];
            if (imageSrc !== "") {
              const img = document.createElement("img");
              img.src = imageSrc.trim();
              item.appendChild(img);
            }

            const cardBody = document.createElement("div");
            cardBody.className = "card-body";

            recordFields.slice(1).forEach((fieldValue, index) => {
              const fieldName = desiredFieldsArray[index + 1];
              const fieldType = fieldsSchema[fieldName];
              const fieldDiv = document.createElement("div");
              fieldDiv.id = `${fieldName}--${fieldType}`;

              if (fieldType === "multipleSelects" || fieldType === "singleSelect") {
                let valuesArray = fieldValue;
                if (typeof fieldValue === "string") {
                  valuesArray = fieldValue.split(",");
                }

                const listContainer = document.createElement("ul");
                listContainer.className = "multipleSelects";

                valuesArray.forEach(value => {
                  const listItem = document.createElement("li");
                  listItem.textContent = value.trim();
                  listContainer.appendChild(listItem);
                });

                fieldDiv.appendChild(listContainer);
              } else {
                fieldDiv.textContent = fieldValue;
              }

              cardBody.appendChild(fieldDiv);

              // Add spacer div after each field
              if (index < desiredFieldsArray.length - 2) {
                const spacerDiv = document.createElement("div");
                spacerDiv.className = "spacer";
                cardBody.appendChild(spacerDiv);
              }
            });

            item.appendChild(cardBody);
            gridContainer.appendChild(item);
          });

          // Initialize Masonry after the grid items are added to the DOM
          initializeMasonry();

          // Enable the button and update the offset for the next page
          loadMoreButton.disabled = false;
          offset = data.offset || '';

          // Show or hide the "Load More" button based on the number of records
          if (data.totalRecords > pageSize) {
            loadMoreButton.style.display = 'block';
          }
        })
        .catch(error => console.error(error.message));
    }

    fetchInitialRecords(); // Call the function to fetch and generate the initial set of records
  })
  .catch(error => console.error(error.message));
