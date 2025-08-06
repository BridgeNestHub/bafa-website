// Global function to fetch and render data into a DataTable
async function fetchDataAndRenderTable(apiEndpoint, tableId, columns, viewHandler, editHandler, deleteHandler, noDataMessageId, totalCountElementId = null) {
    try {
        const response = await fetch(apiEndpoint);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Update stats cards if an element ID is provided
        if (totalCountElementId) {
            document.getElementById(totalCountElementId).textContent = data.length;
        }

        // Destroy existing DataTable if it exists
        if ($.fn.DataTable.isDataTable(`#${tableId}`)) {
            $(`#${tableId}`).DataTable().destroy();
        }

        // Hide/show "No data" message
        const noDataMessageElement = document.getElementById(noDataMessageId);
        if (data.length === 0) {
            if (noDataMessageElement) noDataMessageElement.style.display = 'block';
            $(`#${tableId}`).hide(); // Hide the table itself
        } else {
            if (noDataMessageElement) noDataMessageElement.style.display = 'none';
            $(`#${tableId}`).show(); // Show the table
        }

        // Initialize DataTable with new data
        $(`#${tableId}`).DataTable({
            data: data,
            columns: columns,
            responsive: true,
            pageLength: 10,
            lengthMenu: [5, 10, 25, 50],
            ordering: true, // Enable sorting
            info: true, // Show "Showing X to Y of Z entries"
            paging: true, // Enable pagination
            searching: true, // Enable search box
            language: {
                emptyTable: "No data available in table", // Default for DataTables when no data provided initially
                zeroRecords: "No matching records found"
            },
            // Add custom rendering for actions column if handlers are provided
            columnDefs: [{
                targets: -1, // Last column
                orderable: false, // Actions column should not be sortable
                searchable: false, // Actions column should not be searchable
                render: function (data, type, row) {
                    const viewButton = viewHandler ? `<button type="button" class="btn btn-sm btn-outline-info view-btn" data-id="${row._id}"><i class="fas fa-eye"></i> View</button>` : '';
                    const editButton = editHandler ? `<button type="button" class="btn btn-sm btn-outline-primary edit-btn" data-id="${row._id}"><i class="fas fa-edit"></i> Edit</button>` : '';
                    const deleteButton = deleteHandler ? `<button type="button" class="btn btn-sm btn-outline-danger delete-btn" data-id="${row._id}"><i class="fas fa-trash-alt"></i> Delete</button>` : '';
                    return `<div class="d-flex gap-2">${viewButton}${editButton}${deleteButton}</div>`;
                }
            }]
        });

        // Attach event listeners for view, edit and delete buttons only if handlers exist
        if (viewHandler) {
            $(`#${tableId}`).off('click', '.view-btn').on('click', '.view-btn', function() {
                viewHandler($(this).data('id'));
            });
        }
        if (editHandler) {
            $(`#${tableId}`).off('click', '.edit-btn').on('click', '.edit-btn', function() {
                editHandler($(this).data('id'));
            });
        }
        if (deleteHandler) {
            $(`#${tableId}`).off('click', '.delete-btn').on('click', '.delete-btn', function() {
                deleteHandler($(this).data('id'));
            });
        }

    } catch (error) {
        console.error(`Error fetching data for ${tableId}:`, error);
        showNotification('An error occurred while loading data.', 'danger');
        const noDataMessageElement = document.getElementById(noDataMessageId);
        if (noDataMessageElement) {
            noDataMessageElement.textContent = 'Error loading data. Please try again.';
            noDataMessageElement.style.display = 'block';
        }
        $(`#${tableId}`).hide(); // Hide the table on error
    }
}

// Function to show notifications
function showNotification(message, type = 'success', autoDismiss = true) {
    const alertsContainer = document.querySelector('.content-wrapper');
    if (!alertsContainer) {
        console.error("Error: '.content-wrapper' element not found for notifications. Please ensure it exists in your HTML.");
        return;
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    alertsContainer.insertAdjacentElement('afterbegin', alertDiv);

    if (autoDismiss) {
        setTimeout(() => {
            if (alertsContainer.contains(alertDiv)) {
                const bsAlert = new bootstrap.Alert(alertDiv);
                bsAlert.close();
            }
        }, 5000);
    }
}

// Added emailKey parameter to identify the email field for replies
async function populateAndShowViewModal(id, fetchUrl, modalTitlePrefix, fieldsToDisplay, emailKey = null) {
    try {
        const response = await fetch(fetchUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${modalTitlePrefix.toLowerCase()} details. Status: ${response.status}`);
        }
        const data = await response.json();

        // Adjust title based on common identifying fields
        // Order matters for which field is preferred for the title
        const titleIdentifier = data.title || data.name || data.fullName || data.subject || data.organizationName || data.teamName || data.studentName || data.captainName || data.partnerOrgName || data.partnerContactName || data._id;
        $('#genericViewModalLabel').text(`${modalTitlePrefix}: ${titleIdentifier}`);
        
        const modalBody = $('#genericViewModalBody');
        modalBody.empty(); // Clear previous content

        let htmlContent = '';
        fieldsToDisplay.forEach(field => {
            let value = data[field.key];
            if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
                value = 'N/A';
            } else if (field.type === 'date' && value) {
                value = new Date(value).toLocaleDateString(); // Format date
            } else if (field.type === 'datetime' && value) {
                value = new Date(value).toLocaleString(); // Format datetime
            } else if (field.type === 'link' && value) {
                // For file URLs, resumes, etc.
                value = `<a href="${value}" target="_blank" rel="noopener noreferrer">${value}</a>`;
            } else if (field.type === 'html' && value) {
                // For rich text content like program descriptions
                value = `<div class="quill-content-rendered">${value}</div>`; // Apply a class for potential styling
            } else if (Array.isArray(value)) {
                value = value.length > 0 ? value.join(', ') : 'N/A'; // For arrays like skills, subjects
            }

            htmlContent += `
                <div class="mb-2">
                    <strong>${field.label}:</strong>
                    <p>${value}</p>
                </div>
            `;
        });
        modalBody.append(htmlContent);

        // --- Add Reply Button Logic ---
        const modalFooter = $('#genericViewModal .modal-footer');
        // Remove existing reply button to prevent duplicates if modal is reused
        modalFooter.find('#replyEmailBtn').remove(); // Find and remove by ID

        if (emailKey) { // Only add reply button if an emailKey is provided
            const senderEmail = data[emailKey]; // Get the sender's email using the provided key
            if (senderEmail && typeof senderEmail === 'string' && senderEmail.includes('@')) {
                // Basic subject, you can make this dynamic if needed
                const subject = encodeURIComponent(`Regarding your ${modalTitlePrefix}`);
                const mailtoLink = `mailto:${senderEmail}?subject=${subject}`;
                const replyButton = $(`<a id="replyEmailBtn" class="btn btn-primary me-2" href="${mailtoLink}">Reply to Sender</a>`); // Added me-2 for spacing
                // Insert before the Close button (assuming it's the last child)
                modalFooter.prepend(replyButton);
            }
        }
        // --- End Reply Button Logic ---

        new bootstrap.Modal(document.getElementById('genericViewModal')).show();

    } catch (error) {
        console.error(`Error viewing ${modalTitlePrefix.toLowerCase()}:`, error);
        showNotification(`Error viewing ${modalTitlePrefix.toLowerCase()}: ${error.message}`, 'danger');
    }
}

// Initialize Quill editors
let blogEditor, eventEditor, programEditor, editBlogEditor, editEventEditor, editProgramEditor;

function initializeQuillEditors() {
  if (document.getElementById('blogContentEditor')) {
    blogEditor = new Quill('#blogContentEditor', {
      theme: 'snow',
      placeholder: 'Write your blog post content here...',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote', 'code-block'],
          [{ 'header': 1 }, { 'header': 2 }],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'script': 'sub'}, { 'script': 'super' }],
          [{ 'indent': '-1'}, { 'indent': '+1' }],
          [{ 'direction': 'rtl' }],
          [{ 'size': ['small', false, 'large', 'huge'] }],
          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'font': [] }],
          [{ 'align': [] }],
          ['link', 'image'],
          ['clean']
        ]
      }
    });
    blogEditor.on('text-change', function() {
      document.getElementById('blogContent').value = blogEditor.root.innerHTML;
    });
  }

  if (document.getElementById('eventContentEditor')) {
    eventEditor = new Quill('#eventContentEditor', {
      theme: 'snow',
      placeholder: 'Write your event description here...',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote', 'code-block'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['link', 'image'],
          ['clean']
        ]
      }
    });
    eventEditor.on('text-change', function() {
      document.getElementById('eventContent').value = eventEditor.root.innerHTML;
    });
  }

  if (document.getElementById('programFullDescriptionEditor')) {
    programEditor = new Quill('#programFullDescriptionEditor', {
      theme: 'snow',
      placeholder: 'Write the full program description here...',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote', 'code-block'],
          [{ 'header': 1 }, { 'header': 2 }],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'indent': '-1'}, { 'indent': '+1' }],
          ['link', 'image'],
          ['clean']
        ]
      }
    });
    programEditor.on('text-change', function() {
      document.getElementById('programFullDescription').value = programEditor.root.innerHTML;
    });
  }
}


// --- Blog Post Management ---
async function loadBlogPosts() {
    const columns = [
        { data: 'title' },
        { data: 'createdAt', render: function(data) { return new Date(data).toLocaleDateString(); } },
        { data: 'image', render: function(data) {
            return data ? `<img src="${data}" class="img-preview" alt="Post Image">` : '<span class="text-muted">None</span>';
        }},
        { data: null } // For actions buttons (View, Edit, Delete)
    ];
    await fetchDataAndRenderTable('/admin/api/posts', 'blogTable', columns, viewBlogPost, editBlogPost, deleteBlogPost, 'noBlogPostsMessage', 'blogPostsCount');
}

// Updated to use populateAndShowViewModal
async function viewBlogPost(id) {
    const fields = [
        { key: 'title', label: 'Title' },
        { key: 'slug', label: 'URL Slug' },
        { key: 'createdAt', label: 'Date', type: 'datetime' },
        { key: 'image', label: 'Featured Image', type: 'link' }, // Display as link
        { key: 'content', label: 'Content', type: 'html' }
    ];
    await populateAndShowViewModal(id, `/admin/api/posts/${id}`, 'Blog Post', fields, null); // No email to reply to
}

async function editBlogPost(id) {
    try {
        const response = await fetch(`/admin/api/posts/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch blog post details for editing.');
        }
        const post = await response.json();

        $('#genericEditModalLabel').text(`Edit Blog Post: ${post.title}`);
        const modalBody = $('#genericEditModalBody');
        modalBody.empty(); // Clear previous content

        modalBody.append(`
            <input type="hidden" id="editBlogId" name="id" value="${post._id}">
            <div class="mb-3">
                <label for="editBlogTitle" class="form-label">Title</label>
                <input type="text" class="form-control" id="editBlogTitle" name="title" value="${post.title}" required>
            </div>
            <div class="mb-3">
                <label for="editBlogSlug" class="form-label">Blog URL</label>
                <input type="text" class="form-control" id="editBlogSlug" name="slug" value="${post.slug}" required>
                <small class="form-text text-muted">Blog URL.</small>
            </div>
            <div class="mb-3">
                <label for="editBlogImage" class="form-label">Featured Image</label>
                <input type="file" class="form-control" id="editBlogImage" name="image" accept="image/*">
                ${post.image ? `<img id="editBlogImagePreview" class="img-preview mt-2" src="${post.image}" alt="Current Image">` : `<img id="editBlogImagePreview" class="img-preview mt-2" style="display:none;" alt="Preview">`}
            </div>
            <div class="mb-3">
                <label for="editBlogContent" class="form-label">Content</label>
                <div id="editBlogContentEditor" style="height: 300px;"></div>
                <textarea class="d-none" id="editBlogContent" name="content"></textarea>
            </div>
        `);

        // Initialize Quill editor for edit modal
        editBlogEditor = new Quill('#editBlogContentEditor', {
            theme: 'snow',
            modules: { toolbar: blogEditor.getModule('toolbar').options } // Use same toolbar as create
        });
        editBlogEditor.root.innerHTML = post.content;
        document.getElementById('editBlogContent').value = post.content; // Set initial value for hidden textarea
        editBlogEditor.on('text-change', function() {
            document.getElementById('editBlogContent').value = editBlogEditor.root.innerHTML;
        });

        // Image preview for edit form
        document.getElementById('editBlogImage').addEventListener('change', function() {
            previewImage(this, 'editBlogImagePreview');
        });

        // Handle form submission for edit
        $('#genericEditForm').off('submit').on('submit', async function(event) {
            event.preventDefault();
            const editFormData = new FormData(this);
            // The hidden textarea's value is already updated by Quill's text-change listener
            editFormData.set('content', editBlogEditor.root.innerHTML);

            try {
                const updateResponse = await fetch(`/admin/api/posts/${id}`, {
                    method: 'PUT',
                    body: editFormData
                });

                if (!updateResponse.ok) {
                    const errorData = await updateResponse.json();
                    throw new Error(errorData.message || 'Failed to update blog post.');
                }

                console.log("Update successful, attempting to show notification and hide modal.");

                showNotification('Blog post updated successfully!');
                new bootstrap.Modal(document.getElementById('genericEditModal')).hide();
                loadBlogPosts(); // Reload blog posts table
            } catch (updateError) {
                console.error('Error updating blog post:', updateError);
                showNotification(updateError.message, 'danger');
            }
        });

        new bootstrap.Modal(document.getElementById('genericEditModal')).show();

    } catch (error) {
        console.error('Error editing blog post:', error);
        showNotification(error.message, 'danger');
    }
}


// Handle blog post creation form submission
document.getElementById('create-blog-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    const formData = new FormData(this); // For file uploads
    formData.set('content', blogEditor.root.innerHTML); // Get content from Quill

    try {
        const response = await fetch('/admin/api/posts', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create blog post.');
        }

        const newPost = await response.json();
        showNotification('Blog post created successfully!');
        this.reset(); // Clear the form
        blogEditor.setText(''); // Clear Quill editor
        document.getElementById('blogImagePreview').src = ''; // Clear preview src
        document.getElementById('blogImagePreview').style.display = 'none'; // Hide preview
        loadBlogPosts(); // Reload blog posts table
    } catch (error) {
        console.error('Error creating blog post:', error);
        showNotification(error.message, 'danger');
    }
});

async function deleteBlogPost(id) {
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
        return;
    }
    try {
        const response = await fetch(`/admin/api/posts/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete blog post.');
        }
        showNotification('Blog post deleted successfully!');
        loadBlogPosts(); // Reload blog posts table
    } catch (error) {
        console.error('Error deleting blog post:', error);
        showNotification(error.message, 'danger');
    }
}

// --- Newsletter Subscriptions Management ---
async function loadNewsletterSubscriptions() {
    const columns = [
        { data: 'email' },
        { data: 'createdAt', render: function(data) { return new Date(data).toLocaleString(); } },
        { data: null } // Actions column (View, Delete)
    ];
    await fetchDataAndRenderTable('/admin/api/subscribers', 'subscribersTable', columns, viewNewsletterSubscription, null, deleteNewsletterSubscription, 'noSubscribersMessage', 'subscribersCount');
}

async function viewNewsletterSubscription(id) {
    const fields = [
        { key: 'email', label: 'Email' },
        { key: 'createdAt', label: 'Subscribed On', type: 'datetime' }
    ];
    await populateAndShowViewModal(id, `/admin/api/subscribers/${id}`, 'Newsletter Subscriber', fields, 'email');
}

async function deleteNewsletterSubscription(id) {
    if (!confirm('Are you sure you want to remove this subscriber? This action cannot be undone.')) return;
    try {
        const response = await fetch(`/admin/api/subscribers/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete subscriber.');
        showNotification('Subscriber deleted successfully!');
        loadNewsletterSubscriptions();
    } catch (error) {
        console.error('Error deleting subscriber:', error);
        showNotification(error.message, 'danger');
    }
}

// --- Event Management ---
async function loadEvents() {
    const columns = [
        { data: 'title' },
        { data: 'eventDate', render: function(data, type, row) { 
            const date = new Date(data);
            const time = row.eventTime ? new Date(`2000-01-01T${row.eventTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
            return `${date.toLocaleDateString()} ${time}`;
        }},
        { data: 'location' },
        { data: null } // For actions buttons (View, Edit, Delete)
    ];
    await fetchDataAndRenderTable('/admin/api/events', 'eventsTable', columns, viewEvent, editEvent, deleteEvent, 'noEventsMessage', 'upcomingEventsCount');
}

// Updated to use populateAndShowViewModal
async function viewEvent(id) {
    const fields = [
        { key: 'title', label: 'Title' },
        { key: 'slug', label: 'URL Slug' },
        { key: 'eventDate', label: 'Date', type: 'date' },
        { key: 'eventTime', label: 'Time' }, // Assuming eventTime is a string like "HH:MM"
        { key: 'location', label: 'Location' },
        { key: 'image', label: 'Event Image', type: 'link' },
        { key: 'content', label: 'Description', type: 'html' }
    ];
    await populateAndShowViewModal(id, `/admin/api/events/${id}`, 'Event', fields, null); // No email to reply to
}

async function editEvent(id) {
    try {
        const response = await fetch(`/admin/api/events/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch event details for editing.');
        }
        const event = await response.json();

        $('#genericEditModalLabel').text(`Edit Event: ${event.title}`);
        const modalBody = $('#genericEditModalBody');
        modalBody.empty(); // Clear previous content

        // Format date for input
        const eventDateFormatted = event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : '';

        modalBody.append(`
            <input type="hidden" id="editEventId" name="id" value="${event._id}">
            <div class="mb-3">
                <label for="editEventTitle" class="form-label">Event Title</label>
                <input type="text" class="form-control" id="editEventTitle" name="title" value="${event.title}" required>
            </div>
            <div class="mb-3">
                <label for="editEventSlug" class="form-label">Event URL</label>
                <input type="text" class="form-control" id="editEventSlug" name="slug" value="${event.slug}" || ''>
                <small class="form-text text-muted">Event URL.</small>
            </div>
            <div class="mb-3">
                <label for="editEventDate" class="form-label">Date</label>
                <input type="date" class="form-control" id="editEventDate" name="eventDate" value="${eventDateFormatted}" required>
            </div>
            <div class="mb-3">
                <label for="editEventTime" class="form-label">Event Time (Optional)</label>
                <input type="time" class="form-control" id="editEventTime" name="eventTime" value="${event.eventTime || ''}">
            </div>
            <div class="mb-3">
                <label for="editEventLocation" class="form-label">Location</label>
                <input type="text" class="form-control" id="editEventLocation" name="location" value="${event.location}" required>
            </div>
            <div class="mb-3">
                <label for="editEventImage" class="form-label">Event Image</label>
                <input type="file" class="form-control" id="editEventImage" name="image" accept="image/*">
                ${event.image ? `<img id="editEventImagePreview" class="img-preview mt-2" src="${event.image}" alt="Current Image">` : `<img id="editEventImagePreview" class="img-preview mt-2" style="display:none;" alt="Preview">`}
            </div>
            <div class="mb-3">
                <label for="editEventContent" class="form-label">Event Description</label>
                <div id="editEventContentEditor" style="height: 300px;"></div>
                <textarea class="d-none" id="editEventContent" name="content"></textarea>
            </div>
        `);

        // Initialize Quill editor for edit modal
        editEventEditor = new Quill('#editEventContentEditor', {
            theme: 'snow',
            modules: { toolbar: eventEditor.getModule('toolbar').options }
        });
        editEventEditor.root.innerHTML = event.content;
        document.getElementById('editEventContent').value = event.content;
        editEventEditor.on('text-change', function() {
            document.getElementById('editEventContent').value = editEventEditor.root.innerHTML;
        });

        // Image preview for edit form
        document.getElementById('editEventImage').addEventListener('change', function() {
            previewImage(this, 'editEventImagePreview');
        });

        // Handle form submission for edit
        $('#genericEditForm').off('submit').on('submit', async function(eventSubmit) {
            eventSubmit.preventDefault();
            const editFormData = new FormData(this);
            editFormData.set('content', editEventEditor.root.innerHTML);

            try {
                const updateResponse = await fetch(`/admin/api/events/${id}`, {
                    method: 'PUT',
                    body: editFormData
                });

                if (!updateResponse.ok) {
                    const errorData = await updateResponse.json();
                    throw new Error(errorData.message || 'Failed to update event.');
                }

                showNotification('Event updated successfully!');
                new bootstrap.Modal(document.getElementById('genericEditModal')).hide();
                loadEvents(); // Reload events table
            } catch (updateError) {
                console.error('Error updating event:', updateError);
                showNotification(updateError.message, 'danger');
            }
        });

        new bootstrap.Modal(document.getElementById('genericEditModal')).show();

    } catch (error) {
        console.error('Error editing event:', error);
        showNotification(error.message, 'danger');
    }
}

// Handle event creation form submission
document.getElementById('create-event-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    formData.set('content', eventEditor.root.innerHTML); // Get content from Quill

    try {
        const response = await fetch('/admin/api/events', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create event.');
        }

        showNotification('Event created successfully!');
        this.reset();
        eventEditor.setText(''); // Clear Quill editor
        document.getElementById('eventImagePreview').src = '';
        document.getElementById('eventImagePreview').style.display = 'none';
        loadEvents();
    } catch (error) {
        console.error('Error creating event:', error);
        showNotification(error.message, 'danger');
    }
});

async function deleteEvent(id) {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        return;
    }
    try {
        const response = await fetch(`/admin/api/events/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete event.');
        }
        showNotification('Event deleted successfully!');
        loadEvents();
    } catch (error) {
        console.error('Error deleting event:', error);
        showNotification(error.message, 'danger');
    }
}

// --- Program Management ---
async function loadPrograms() {
    const columns = [
        { data: 'title' },
        { data: 'ageRange' },
        { data: 'status' },
        { data: 'image', render: function(data) {
            return data ? `<img src="${data}" class="img-preview" alt="Program Image">` : '<span class="text-muted">None</span>';
        }},
        { data: null } // For actions buttons (View, Edit, Delete)
    ];
    await fetchDataAndRenderTable('/admin/api/programs', 'programsTable', columns, viewProgram, editProgram, deleteProgram, 'noProgramsMessage', 'activeProgramsCount');
}

// Updated to use populateAndShowViewModal
async function viewProgram(id) {
    const fields = [
        { key: 'title', label: 'Program Title' },
        { key: 'slug', label: 'URL Slug' },
        { key: 'ageRange', label: 'Target Age Range' },
        { key: 'status', label: 'Status' },
        { key: 'shortDescription', label: 'Short Description' },
        { key: 'image', label: 'Program Image', type: 'link' },
        { key: 'fullDescription', label: 'Full Description', type: 'html' },
        { key: 'createdAt', label: 'Created On', type: 'datetime' },
        { key: 'updatedAt', label: 'Last Updated', type: 'datetime' }
    ];
    await populateAndShowViewModal(id, `/admin/api/programs/${id}`, 'Program Details', fields, null); // No email to reply to
}

async function editProgram(id) {
    try {
        const response = await fetch(`/admin/api/programs/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch program details for editing.');
        }
        const program = await response.json();

        $('#genericEditModalLabel').text(`Edit Program: ${program.title}`);
        const modalBody = $('#genericEditModalBody');
        modalBody.empty(); // Clear previous content

        modalBody.append(`
            <input type="hidden" id="editProgramId" name="id" value="${program._id}">
            <div class="mb-3">
                <label for="editProgramTitle" class="form-label">Program Title</label>
                <input type="text" class="form-control" id="editProgramTitle" name="title" value="${program.title}" required>
            </div>
            <div class="mb-3">
                <label for="editProgramSlug" class="form-label">Program Slug (for URL)</label>
                <input type="text" class="form-control" id="editProgramSlug" name="slug" value="${program.slug}" required>
                <small class="form-text text-muted">A short, unique identifier for the program URL.</small>
            </div>
            <div class="mb-3">
                <label for="editProgramAgeRange" class="form-label">Target Age Range (e.g., 16-30)</label>
                <input type="text" class="form-control" id="editProgramAgeRange" name="ageRange" value="${program.ageRange || ''}" placeholder="e.g., Ages 12-18">
            </div>
            <div class="mb-3">
                <label for="editProgramStatus" class="form-label">Program Status</label>
                <select class="form-select" id="editProgramStatus" name="status">
                    <option value="Active" ${program.status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Upcoming" ${program.status === 'Upcoming' ? 'selected' : ''}>Upcoming</option>
                    <option value="Closed" ${program.status === 'Closed' ? 'selected' : ''}>Closed</option>
                </select>
            </div>
            <div class="mb-3">
                <label for="editProgramShortDescription" class="form-label">Short Description (Lead Paragraph)</label>
                <textarea class="form-control" id="editProgramShortDescription" name="shortDescription" rows="3" required>${program.shortDescription}</textarea>
            </div>
            <div class="mb-3">
                <label for="editProgramImage" class="form-label">Program Image</label>
                <input type="file" class="form-control" id="editProgramImage" name="image" accept="image/*">
                ${program.image ? `<img id="editProgramImagePreview" class="img-preview mt-2" src="${program.image}" alt="Current Image">` : `<img id="editProgramImagePreview" class="img-preview mt-2" style="display:none;" alt="Preview">`}
            </div>
            <div class="mb-3">
                <label for="editProgramFullDescription" class="form-label">Full Program Description / Components</label>
                <div id="editProgramFullDescriptionEditor" style="height: 300px;"></div>
                <textarea class="d-none" id="editProgramFullDescription" name="fullDescription"></textarea>
            </div>
        `);

        // Initialize Quill editor for edit modal
        editProgramEditor = new Quill('#editProgramFullDescriptionEditor', {
            theme: 'snow',
            modules: { toolbar: programEditor.getModule('toolbar').options }
        });
        editProgramEditor.root.innerHTML = program.fullDescription;
        document.getElementById('editProgramFullDescription').value = program.fullDescription;
        editProgramEditor.on('text-change', function() {
            document.getElementById('editProgramFullDescription').value = editProgramEditor.root.innerHTML;
        });

        // Image preview for edit form
        document.getElementById('editProgramImage').addEventListener('change', function() {
            previewImage(this, 'editProgramImagePreview');
        });

        // Handle form submission for edit
        $('#genericEditForm').off('submit').on('submit', async function(eventSubmit) {
            eventSubmit.preventDefault();
            const editFormData = new FormData(this);
            editFormData.set('fullDescription', editProgramEditor.root.innerHTML);

            try {
                const updateResponse = await fetch(`/admin/api/programs/${id}`, {
                    method: 'PUT',
                    body: editFormData
                });

                if (!updateResponse.ok) {
                    const errorData = await updateResponse.json();
                    throw new Error(errorData.message || 'Failed to update program.');
                }

                showNotification('Program updated successfully!');
                new bootstrap.Modal(document.getElementById('genericEditModal')).hide();
                loadPrograms(); // Reload programs table
            } catch (updateError) {
                console.error('Error updating program:', updateError);
                showNotification(updateError.message, 'danger');
            }
        });

        new bootstrap.Modal(document.getElementById('genericEditModal')).show();

    } catch (error) {
        console.error('Error editing program:', error);
        showNotification(error.message, 'danger');
    }
}


document.getElementById('create-program-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    formData.set('fullDescription', programEditor.root.innerHTML); // Get content from Quill

    try {
        const response = await fetch('/admin/api/programs', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create program.');
        }

        showNotification('Program created successfully!');
        this.reset();
        programEditor.setText(''); // Clear Quill editor
        document.getElementById('programImagePreview').src = '';
        document.getElementById('programImagePreview').style.display = 'none';
        loadPrograms();
    } catch (error) {
        console.error('Error creating program:', error);
        showNotification(error.message, 'danger');
    }
});

async function deleteProgram(id) {
    if (!confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
        return;
    }
    try {
        const response = await fetch(`/admin/api/programs/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete program.');
        }
        showNotification('Program deleted successfully!');
        loadPrograms();
    } catch (error) {
        console.error('Error deleting program:', error);
        showNotification(error.message, 'danger');
    }
}

// --- Contact Form Submissions Management ---
async function loadContactForms() {
    const columns = [
        { data: 'name' },
        { data: 'email' },
        { data: 'subject', defaultContent: 'N/A' }, // Use defaultContent for potentially missing fields
        { data: 'createdAt', render: function(data) { return new Date(data).toLocaleString(); } },
        { data: null } // Actions column (View, Delete)
    ];
    await fetchDataAndRenderTable('/admin/api/contact-forms', 'contactFormsTable', columns, viewContactForm, null, deleteContactForm, 'noContactFormsMessage');
    updateTotalApplicationsCount(); 
}

// Updated to use populateAndShowViewModal
async function viewContactForm(id) {
    const fields = [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'subject', label: 'Subject' },
        { key: 'message', label: 'Message' },
        { key: 'createdAt', label: 'Date', type: 'datetime' }
    ];
    await populateAndShowViewModal(id, `/admin/api/contact-forms/${id}`, 'Contact Form Submission', fields, 'email');
}

async function deleteContactForm(id) {
    if (!confirm('Are you sure you want to delete this contact submission? This action cannot be undone.')) {
        return;
    }
    try {
        const response = await fetch(`/admin/api/contact-forms/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete contact form.');
        }
        showNotification('Contact form deleted successfully!', 'success');
        loadContactForms(); // Reload the table after deletion
    } catch (error) {
        console.error('Error deleting contact form:', error);
        showNotification(error.message, 'danger');
    }
}

// --- Volunteer Applications Management ---
async function loadVolunteerApplications() {
    const columns = [
        { data: 'firstName', render: function(data, type, row) { return `${data} ${row.lastName}`; } },
        { data: 'email' },
        { data: 'volunteerInterests', render: function(data) { return data ? data.join(', ') : 'N/A'; } },
        { data: 'createdAt', render: function(data) { return new Date(data).toLocaleString(); } },
        { data: null } // Actions column (View, Delete)
    ];
    await fetchDataAndRenderTable('/admin/api/applications/volunteer', 'volunteerApplicationsTable', columns, viewVolunteerApplication, null, deleteVolunteerApplication, 'noVolunteerApplicationsMessage');
    updateTotalApplicationsCount();
}

// Updated to use populateAndShowViewModal
async function viewVolunteerApplication(id) {
    const fields = [
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName', label: 'Last Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'address', label: 'Address' },
        { key: 'volunteerInterests', label: 'Interests', type: 'array' },
        { key: 'availability', label: 'Availability' },
        { key: 'message', label: 'Message' },
        { key: 'createdAt', label: 'Submitted On', type: 'datetime' }
    ];
    await populateAndShowViewModal(id, `/admin/api/applications/volunteer/${id}`, 'Volunteer Application', fields, 'email');
}

async function deleteVolunteerApplication(id) {
    if (!confirm('Are you sure you want to delete this volunteer application? This action cannot be undone.')) {
        return;
    }
    try {
        const response = await fetch(`/admin/api/applications/volunteer/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete volunteer application.');
        }
        showNotification('Volunteer application deleted successfully!', 'success');
        loadVolunteerApplications();
    } catch (error) {
        console.error('Error deleting volunteer application:', error);
        showNotification(error.message, 'danger');
    }
}

// --- Education Enrollment Applications Management ---
async function loadEnrollmentApplications() {
    const columns = [
        { data: 'firstName', render: function(data, type, row) { return `${data} ${row.lastName}`; } },
        { data: 'email' },
        { data: 'programInterest' },
        { data: 'createdAt', render: function(data) { return new Date(data).toLocaleString(); } },
        { data: null } // Actions column (View, Delete)
    ];
    await fetchDataAndRenderTable('/admin/api/applications/enrollment', 'enrollmentAppsTable', columns, viewEnrollmentApplication, null, deleteEnrollmentApplication, 'noEnrollmentAppsMessage');
    updateTotalApplicationsCount();
}

// Updated to use populateAndShowViewModal
async function viewEnrollmentApplication(id) {
    const fields = [
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName', label: 'Last Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'school', label: 'School' },
        { key: 'gradeLevel', label: 'Grade Level' },
        { key: 'programInterest', label: 'Program Interest' },
        { key: 'message', label: 'Message' },
        { key: 'createdAt', label: 'Submitted On', type: 'datetime' }
    ];
    await populateAndShowViewModal(id, `/admin/api/applications/enrollment/${id}`, 'Education Enrollment', fields, 'email');
}

async function deleteEnrollmentApplication(id) {
    if (!confirm('Are you sure you want to delete this enrollment application?')) return;
    try {
        const response = await fetch(`/admin/api/applications/enrollment/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete enrollment application.');
        showNotification('Enrollment application deleted successfully!');
        loadEnrollmentApplications();
    } catch (error) {
        console.error('Error deleting enrollment application:', error);
        showNotification(error.message, 'danger');
    }
}

// --- Tutor Applications Management ---
async function loadTutorApplications() {
    const columns = [
        { data: 'firstName', render: function(data, type, row) { return `${data} ${row.lastName}`; } },
        { data: 'email' },
        { data: 'tutorSubjects', render: function(data) { return data ? data.join(', ') : 'N/A'; } },
        { data: 'message', render: function(data) { return data ? data : 'No message'; } },
        { data: 'createdAt', render: function(data) { return new Date(data).toLocaleString(); } },
        { data: null } // Actions column (View, Delete)
    ];
    await fetchDataAndRenderTable('/admin/api/applications/tutor', 'tutorAppsTable', columns, viewTutorApplication, null, deleteTutorApplication, 'noTutorAppsMessage');
    updateTotalApplicationsCount();
}

// Updated to use populateAndShowViewModal
async function viewTutorApplication(id) {
    const fields = [
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName', label: 'Last Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        // { key: 'tutorSubjects', label: 'Subjects Taught' },
        { key: 'tutorSubjects', label: 'Subjects Taught',
            format: (subjects) => Array.isArray(subjects) ? subjects.join(', ') : subjects
          },
        { key: 'experience', label: 'Experience' },
        { key: 'tutorAvailability', label: 'Tutor Availability' },
        { key: 'message', label: 'Message' },
        { key: 'createdAt', label: 'Submitted On', type: 'datetime' }
    ];
    await populateAndShowViewModal(id, `/admin/api/applications/tutor/${id}`, 'Tutor Application', fields, 'email');
}

async function deleteTutorApplication(id) {
    if (!confirm('Are you sure you want to delete this tutor application?')) return;
    try {
        const response = await fetch(`/admin/api/applications/tutor/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete tutor application.');
        showNotification('Tutor application deleted successfully!');
        loadTutorApplications();
    } catch (error) {
        console.error('Error deleting tutor application:', error);
        showNotification(error.message, 'danger');
    }
}

// --- Career Program: Internship Applications (from Apply Now modal) ---
async function loadCareerApplyNowApplications() {
    const columns = [
        { data: 'firstName', render: function(data, type, row) { return `${data} ${row.lastName}`; } },
        { data: 'email' },
        { data: 'age', defaultContent: 'N/A' },
        { data: 'createdAt', render: function(data) { return new Date(data).toLocaleString(); } },
        { data: null } // Actions column (View, Delete)
    ];
    // Ensure the API endpoint matches your admin route
    await fetchDataAndRenderTable('/admin/api/applications/career/apply', 'careerApplyNowTable', columns, viewCareerApplyNowApplication, null, deleteCareerApplyNowApplication, 'noCareerApplyNowMessage');
    updateTotalApplicationsCount();
}

// Updated to use populateAndShowViewModal with corrected field names
async function viewCareerApplyNowApplication(id) {
    const fields = [
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName', label: 'Last Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'age', label: 'Age' },
        { key: 'interest', label: 'Area of Interest' }, // Corrected from 'education'
        // { key: 'resumePath', label: 'Resume/CV', type: 'link' }, // Enable if you implement file uploads
        { key: 'coverLetter', label: 'Cover Letter / Message' }, // Corrected from 'message'/'experience'
        { key: 'createdAt', label: 'Submitted On', type: 'datetime' }
    ];
    await populateAndShowViewModal(id, `/admin/api/applications/career/apply/${id}`, 'Internship Application', fields, 'email');
}

async function deleteCareerApplyNowApplication(id) {
    if (!confirm('Are you sure you want to delete this career internship application?')) return;
    try {
        const response = await fetch(`/admin/api/applications/career/apply/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete career internship application.');
        showNotification('Career internship application deleted successfully!');
        loadCareerApplyNowApplications();
    } catch (error) {
        console.error('Error deleting career internship application:', error);
        showNotification(error.message, 'danger');
    }
}

// --- Career Program: Fund Internships Inquiries ---
async function loadFundInternshipsInquiries() {
    const columns = [
        { data: 'name', defaultContent: 'N/A' },
        { data: 'email' },
        { data: 'sponsorshipLevel', defaultContent: 'N/A' }, // Corrected from 'fundLevel'
        { data: 'createdAt', render: function(data) { return new Date(data).toLocaleString(); } },
        { data: null } // Actions column (View, Delete)
    ];
    await fetchDataAndRenderTable('/admin/api/applications/career/fund-internships', 'fundInternshipsTable', columns, viewFundInternshipsInquiry, null, deleteFundInternshipsInquiry, 'noFundInternshipsMessage');
    updateTotalApplicationsCount();
}

// Updated to use populateAndShowViewModal with corrected field names
async function viewFundInternshipsInquiry(id) {
    const fields = [
        { key: 'name', label: 'Name/Organization' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'sponsorshipLevel', label: 'Sponsorship Level' }, // Corrected from 'fundLevel'
        { key: 'message', label: 'Message' },
        { key: 'createdAt', label: 'Submitted On', type: 'datetime' }
    ];
    await populateAndShowViewModal(id, `/admin/api/applications/career/fund-internships/${id}`, 'Fund Internship Inquiry', fields, 'email');
}

async function deleteFundInternshipsInquiry(id) {
    if (!confirm('Are you sure you want to delete this internship funding inquiry?')) return;
    try {
        const response = await fetch(`/admin/api/applications/career/fund-internships/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete inquiry.');
        showNotification('Internship funding inquiry deleted successfully!');
        loadFundInternshipsInquiries();
    } catch (error) {
        console.error('Error deleting inquiry:', error);
        showNotification(error.message, 'danger');
    }
}

// --- Career Program: Become a Partner Inquiries ---
async function loadBecomePartnerInquiries() {
    const columns = [
        { data: 'organizationName', defaultContent: 'N/A' }, // Corrected from 'partnerOrgName'
        { data: 'contactName', defaultContent: 'N/A' },    // Corrected from 'partnerContactName'
        { data: 'email', defaultContent: 'N/A' },           // Corrected from 'partnerEmail'
        { data: 'partnershipType', defaultContent: 'N/A' }, // Corrected from 'partnerType'
        { data: 'createdAt', render: function(data) { return new Date(data).toLocaleString(); } },
        { data: null } // Actions column (View, Delete)
    ];
    await fetchDataAndRenderTable('/admin/api/applications/career/partner', 'becomePartnerTable', columns, viewBecomePartnerInquiry, null, deleteBecomePartnerInquiry, 'noBecomePartnerMessage');
    updateTotalApplicationsCount();
}

// Updated to use populateAndShowViewModal with corrected field names
async function viewBecomePartnerInquiry(id) {
    const fields = [
        { key: 'organizationName', label: 'Organization Name' }, // Corrected
        { key: 'contactName', label: 'Contact Name' },           // Corrected
        { key: 'email', label: 'Email' },                       // Corrected
        { key: 'phone', label: 'Phone' },                       // Corrected
        { key: 'partnershipType', label: 'Partnership Type' },   // Corrected
        { key: 'message', label: 'Message' },                   // Corrected
        { key: 'createdAt', label: 'Submitted On', type: 'datetime' }
    ];
    await populateAndShowViewModal(id, `/admin/api/applications/career/partner/${id}`, 'Become Partner Inquiry', fields, 'email'); // Changed 'partnerEmail' to 'email'
}

async function deleteBecomePartnerInquiry(id) {
    if (!confirm('Are you sure you want to delete this partner inquiry?')) return;
    try {
        const response = await fetch(`/admin/api/applications/career/partner/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete inquiry.');
        showNotification('Partner inquiry deleted successfully!');
        loadBecomePartnerInquiries();
    } catch (error) {
        console.error('Error deleting inquiry:', error);
        showNotification(error.message, 'danger');
    }
}

// --- Sports: Join a Team Registrations ---
async function loadJoinTeamRegistrations() {
    const columns = [
        { data: 'firstName', render: function(data, type, row) { return `${data} ${row.lastName}`; } },
        { data: 'email' },
        { data: 'teamSportInterest', defaultContent: 'N/A' },
        { data: 'createdAt', render: function(data) { return new Date(data).toLocaleString(); } },
        { data: null } // Actions column (View, Delete)
    ];
    await fetchDataAndRenderTable('/admin/api/applications/sports/join-team', 'joinTeamTable', columns, viewJoinTeamRegistration, null, deleteJoinTeamRegistration, 'noJoinTeamMessage');
    updateTotalApplicationsCount();
}

// Updated to use populateAndShowViewModal
async function viewJoinTeamRegistration(id) {
    const fields = [
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName', label: 'Last Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'teamSportInterest', label: 'Sport Interest' },
        { key: 'message', label: 'Message' },
        { key: 'createdAt', label: 'Submitted On', type: 'datetime' }
    ];
    await populateAndShowViewModal(id, `/admin/api/applications/sports/join-team/${id}`, 'Team Registration', fields, 'email');
}

async function deleteJoinTeamRegistration(id) {
    if (!confirm('Are you sure you want to delete this team registration?')) return;
    try {
        const response = await fetch(`/admin/api/applications/sports/join-team/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete registration.');
        showNotification('Team registration deleted successfully!');
        loadJoinTeamRegistrations();
    } catch (error) {
        console.error('Error deleting registration:', error);
        showNotification(error.message, 'danger');
    }
}


// --- Tech Bootcamps Registrations Management ---
async function loadBootcampRegistrations() {
    const columns = [
        { data: 'name' }, 
        { data: 'email' },
        { data: 'program', defaultContent: 'N/A' },
        { data: 'createdAt', render: function(data) { return new Date(data).toLocaleString(); } },
        { data: null } // Actions column (View, Delete)
    ];
    await fetchDataAndRenderTable('/admin/api/applications/bootcamp', 'bootcampRegTable', columns, viewBootcampRegistration, null, deleteBootcampRegistration, 'noBootcampRegMessage');
    updateTotalApplicationsCount();
}

// Updated to use populateAndShowViewModal
async function viewBootcampRegistration(id) {
    const fields = [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'program', label: 'Program' },
        { key: 'experienceLevel', label: 'Experience Level' },
        { key: 'message', label: 'Message' },
        { key: 'createdAt', label: 'Submitted On', type: 'datetime' }
    ];
    await populateAndShowViewModal(id, `/admin/api/applications/bootcamp/${id}`, 'Bootcamp Registration', fields, 'email');
}

async function deleteBootcampRegistration(id) {
    if (!confirm('Are you sure you want to delete this bootcamp registration?')) return;
    try {
        const response = await fetch(`/admin/api/applications/bootcamp/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete bootcamp registration.');
        showNotification('Bootcamp registration deleted successfully!');
        loadBootcampRegistrations();
    } catch (error) {
        console.error('Error deleting bootcamp registration:', error);
        showNotification(error.message, 'danger');
    }
}

// Function to update the total new applications count
async function updateTotalApplicationsCount() {
    let total = 0;
    try {
        const endpoints = [
            '/admin/api/contact-forms',
            '/admin/api/applications/volunteer',
            '/admin/api/applications/enrollment',
            '/admin/api/applications/tutor',
            '/admin/api/applications/career/apply',
            '/admin/api/applications/career/fund-internships',
            '/admin/api/applications/career/partner',
            '/admin/api/applications/sports/join-team',
            '/admin/api/applications/bootcamp'
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint);
                if (!response.ok) {
                    console.warn(`Could not fetch data from ${endpoint}: Status ${response.status}`);
                    continue; // Skip this endpoint and try the next one
                }
                const data = await response.json();
                total += data.length;
            } catch (innerError) {
                console.error(`Error fetching from ${endpoint}:`, innerError);
            }
        }
        document.getElementById('newApplicationsCount').textContent = total;
    } catch (error) {
        console.error('Error updating total applications count:', error);
        document.getElementById('newApplicationsCount').textContent = 'Error';
    }
}


// --- General Dashboard Initialization ---
// At the very end of your dashboard.js file

// --- General Dashboard Initialization ---
$(document).ready(function() {
    initializeQuillEditors(); // Initialize Quill editors on page load

    // Initial data loading for all sections
    loadBlogPosts();
    loadEvents();
    loadPrograms();
    loadContactForms();
    loadVolunteerApplications();
    loadEnrollmentApplications();
    loadTutorApplications();
    loadCareerApplyNowApplications();
    loadFundInternshipsInquiries();
    loadBecomePartnerInquiries();
    loadJoinTeamRegistrations();
    loadBootcampRegistrations();
    updateTotalApplicationsCount();
    loadNewsletterSubscriptions();

    // Preview image before upload (re-added function here as it's only used inside this block)
    function previewImage(input, previewId) {
        const preview = document.getElementById(previewId);
        if (!preview) return;

        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }

        if (file) {
            reader.readAsDataURL(file);
        } else {
            preview.src = '';
            preview.style.display = 'none';
        }
    }

    // Initialize image preview for all forms with image inputs
    // Using optional chaining (?) for robustness if elements don't exist
    document.getElementById('blogImage')?.addEventListener('change', function() {
        previewImage(this, 'blogImagePreview');
    });

    document.getElementById('eventImage')?.addEventListener('change', function() {
        previewImage(this, 'eventImagePreview');
    });

    document.getElementById('programImage')?.addEventListener('change', function() {
        previewImage(this, 'programImagePreview');
    });

    // === Custom Sidebar Toggle JavaScript (moved from separate DOMContentLoaded) ===
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    if (sidebarToggle && sidebar && mainContent) {
        sidebarToggle.addEventListener('click', function() {
            document.body.classList.toggle('sidebar-open');
        });
    }

    // Optional: Close sidebar if clicking outside of it on mobile
    mainContent.addEventListener('click', function(event) {
        if (document.body.classList.contains('sidebar-open') && window.innerWidth <= 768) {
            if (!sidebar.contains(event.target) && (!sidebarToggle || !sidebarToggle.contains(event.target))) {
                document.body.classList.remove('sidebar-open');
            }
        }
    });

    // Optional: Adjust layout on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            document.body.classList.remove('sidebar-open');
        }
    });
});