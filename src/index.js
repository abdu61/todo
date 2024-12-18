import Project from './project.js';
import ToDo from './todo.js';

import "./styles.css";

document.addEventListener('DOMContentLoaded', () => {
    // Initialize projects and selectedProject
    let projects = loadProjects();
    let selectedProject = null;

    const defaultProject = projects.find(p => p.name === 'Default') || new Project('Default');
    if (!projects.includes(defaultProject)) {
        projects.push(defaultProject);
        saveProjects();
    }
    selectedProject = 'Today';  // Set selectedProject to 'Today'

    // Attach event listeners after DOM content is loaded
    document.getElementById('create-project').addEventListener('click', () => {
        openModal('project');
    });

    function renderProjects() {
        const projectList = document.getElementById('project-list');
        projectList.innerHTML = '';

        // Add 'Today' section to the project list
        const todayLi = document.createElement('li');
        todayLi.textContent = 'Today';
        if (selectedProject === 'Today') {
            todayLi.classList.add('active');
        }
        todayLi.addEventListener('click', () => {
            selectedProject = 'Today';
            renderProjects();  // Update active state
            renderTodos('Today');
        });
        projectList.appendChild(todayLi);

        projects.forEach(project => {
            const li = document.createElement('li');
            li.textContent = project.name;
            if (selectedProject === project) {
                li.classList.add('active');
            }
            li.addEventListener('click', () => {
                selectedProject = project;
                renderProjects();  // Update active state
                renderTodos(project);
            });
            projectList.appendChild(li);
        });
    }

    function renderTodos(project) {
        const todoList = document.getElementById('todo-list');
        todoList.innerHTML = '';
        const header = document.createElement('div');
        header.className = 'todo-header';

        if (project === 'Today') {
            header.innerHTML = `<h2>Today's ToDos</h2>`;
        } else {
            header.innerHTML = `<h2>${project.name}</h2><button id="create-todo">Create ToDo</button>`;
        }
        todoList.appendChild(header);

        if (project !== 'Today') {
            header.querySelector('#create-todo').addEventListener('click', () => {
                openModal('todo', project);
            });
        }

        // Create a container for the todos
        const todoContainer = document.createElement('div');
        todoContainer.className = 'todo-container';

        let todosToShow = [];

        if (project === 'Today') {
            // Collect all todos due today from all projects
            const today = new Date();
            todosToShow = projects.flatMap(proj =>
                proj.getTodos().map((todo, index) => ({ todo, project: proj, index }))
            ).filter(({ todo }) =>
                todo.dueDate.toDateString() === today.toDateString()
            );
        } else {
            todosToShow = project.getTodos().map((todo, index) => ({ todo, project, index }));
        }

        // Sort todos by priority
        const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
        todosToShow.sort((a, b) => {
            const aPriority = priorityOrder[a.todo.priority] || 99;
            const bPriority = priorityOrder[b.todo.priority] || 99;
            return aPriority - bPriority;
        });

        todosToShow.forEach(({ todo, project, index }) => {
            const div = document.createElement('div');
            div.className = 'todo-item';
            div.innerHTML = `
                <div>${todo.title}</div>
                <div>${todo.dueDate.toDateString()}</div>
                ${project.name !== 'Default' ? `<div>Project: ${project.name}</div>` : ''}
                ${
                    selectedProject !== 'Today' ?
                    `<div>
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn">Delete</button>
                    </div>` : ''
                }
            `;
            if (selectedProject !== 'Today') {
                // Attach event listeners to Edit and Delete buttons
                div.querySelector('.edit-btn').addEventListener('click', () => {
                    editTodo(project, index);
                });
                div.querySelector('.delete-btn').addEventListener('click', () => {
                    deleteTodo(project, index);
                });
            }
            todoContainer.appendChild(div);
        });

        todoList.appendChild(todoContainer);
    }

    function saveProjects() {
        localStorage.setItem('projects', JSON.stringify(projects));
    }

    function loadProjects() {
        const projectsData = localStorage.getItem('projects');
        if (projectsData) {
            const parsedProjects = JSON.parse(projectsData);
            return parsedProjects.map(projectData => {
                const project = new Project(projectData.name);
                projectData.todos.forEach(todoData => {
                    const todo = new ToDo(
                        todoData.title,
                        todoData.description,
                        new Date(todoData.dueDate),
                        todoData.priority,
                        todoData.notes,
                        todoData.checklist
                    );
                    if (todoData.completed) {
                        todo.toggleComplete();
                    }
                    project.addTodo(todo);
                });
                return project;
            });
        }
        return [];
    }

    function openModal(type, project = null, todo = null, todoIndex = null) {
        const modal = document.getElementById('modal');
        modal.classList.add('active');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalFooter = document.getElementById('modal-footer');
        modalBody.innerHTML = '';
        modalFooter.innerHTML = '';

        if (type === 'project') {
            modalTitle.textContent = 'Create Project';
            modalBody.innerHTML = `
                <label for="project-name">Project Name:</label>
                <input type="text" id="project-name">
            `;
            modalFooter.innerHTML = `
                <button id="modal-create-btn">Create</button>
                <button id="modal-cancel-btn">Cancel</button>
            `;
            modalFooter.querySelector('#modal-create-btn').addEventListener('click', createProject);
            modalFooter.querySelector('#modal-cancel-btn').addEventListener('click', closeModal);
        } else if (type === 'todo') {
            modalTitle.textContent = 'Create ToDo';
            modalBody.innerHTML = `
                <label for="todo-title">Title:</label>
                <input type="text" id="todo-title"><br>
                <label for="todo-description">Description:</label>
                <input type="text" id="todo-description"><br>
                <label for="todo-due-date">Due Date:</label>
                <input type="date" id="todo-due-date"><br>
                <label for="todo-priority">Priority:</label>
                <input type="text" id="todo-priority"><br>
                <label for="todo-project">Project:</label>
                <select id="todo-project">
                    ${projects.map(p => `<option value="${p.name}" ${p === project ? 'selected' : ''}>${p.name}</option>`).join('')}
                </select>
            `;
            modalFooter.innerHTML = `
                <button id="modal-create-btn">Create</button>
                <button id="modal-cancel-btn">Cancel</button>
            `;
            modalFooter.querySelector('#modal-create-btn').addEventListener('click', createTodo);
            modalFooter.querySelector('#modal-cancel-btn').addEventListener('click', closeModal);
        } else if (type === 'edit-todo') {
            modalTitle.textContent = 'Edit ToDo';
            modalBody.innerHTML = `
                <label for="todo-title">Title:</label>
                <input type="text" id="todo-title" value="${todo.title}">
                <br>
                <label for="todo-description">Description:</label>
                <input type="text" id="todo-description" value="${todo.description}">
                <br>
                <label for="todo-due-date">Due Date:</label>
                <input type="date" id="todo-due-date" value="${todo.dueDate.toISOString().split('T')[0]}">
                <br>
                <label for="todo-priority">Priority:</label>
                <input type="text" id="todo-priority" value="${todo.priority}">
                <br>
            `;
            modalFooter.innerHTML = `
                <button id="modal-update-btn">Update</button>
                <button id="modal-cancel-btn">Cancel</button>
            `;
            modalFooter.querySelector('#modal-update-btn').addEventListener('click', () => {
                updateTodo(project, todoIndex);
            });
            modalFooter.querySelector('#modal-cancel-btn').addEventListener('click', closeModal);
        }
    }

    // Ensure 'closeModal' is defined in the global scope
    function closeModal() {
        const modal = document.getElementById('modal');
        if (!modal) {
            console.warn('Modal element not found');
            return;
        }
        
        modal.classList.remove('active');
        document.body.style.overflow = 'visible'; // Restore page scrolling
    }

    function createProject() {
        const projectName = document.getElementById('project-name').value;
        if (projectName) {
            const project = new Project(projectName);
            projects.push(project);
            saveProjects();
            renderProjects();
            closeModal();
        }
    }

    function createTodo() {
        const title = document.getElementById('todo-title').value;
        const description = document.getElementById('todo-description').value;
        const dueDate = new Date(document.getElementById('todo-due-date').value);
        const priority = document.getElementById('todo-priority').value;
        const projectName = document.getElementById('todo-project').value;
        const project = projects.find(p => p.name === projectName);
        if (title && description && dueDate && priority && project) {
            const todo = new ToDo(title, description, dueDate, priority);
            project.addTodo(todo);
            saveProjects();
            renderTodos(project);
            closeModal();
        }
    }

    function editTodo(project, todoIndex) {
        const todo = project.getTodos()[todoIndex];
        openModal('edit-todo', project, todo, todoIndex);
    }

    function deleteTodo(project, todoIndex) {
        project.todos.splice(todoIndex, 1);
        saveProjects();
        renderTodos(project);
    }

    function updateTodo(project, todoIndex) {
        const title = document.getElementById('todo-title').value;
        const description = document.getElementById('todo-description').value;
        const dueDate = new Date(document.getElementById('todo-due-date').value);
        const priority = document.getElementById('todo-priority').value;
        if (title && description && dueDate && priority) {
            const todo = project.getTodos()[todoIndex];
            todo.title = title;
            todo.description = description;
            todo.dueDate = dueDate;
            todo.priority = priority;
            saveProjects();
            renderTodos(project);
            closeModal();
        }
    }

    // Initial render calls
    renderProjects();
    renderTodos('Today');  // Render 'Today' todos on page load
});