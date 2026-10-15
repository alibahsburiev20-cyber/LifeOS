// SPDX-License-Identifier: Apache-2.0
// LifeOS web interface: plain JavaScript, no build step.
// All user text is inserted with textContent / text nodes, never as HTML.
"use strict";

(() => {
  const STRINGS = {
    en: {
      banner: "Early prototype, not a finished product.",
      loading: "Loading...",
      retry: "Try again",
      back: "Back",
      sign_out: "Sign out",
      setup_title: "Create your passphrase",
      login_title: "Sign in",
      passphrase: "Passphrase",
      passphrase_confirm: "Repeat the passphrase",
      passphrase_hint:
        "At least 12 characters. There is no recovery: if you forget it, the database has to be deleted.",
      setup_warning:
        "The first person who opens this page chooses the passphrase. Do this yourself before sharing access.",
      mismatch: "The passphrases do not match.",
      sign_in: "Sign in",
      create: "Create",
      nav_projects: "Projects",
      nav_memory: "Memory",
      nav_models: "Models",
      projects_title: "Projects",
      new_project: "New project",
      project_name: "Project name",
      project_goal: "Goal (optional)",
      create_project: "Create project",
      no_projects: "No projects yet. Create the first one.",
      delete_project: "Delete project",
      confirm_delete_project: "Delete this project with its tasks, chats and project memories?",
      tab_chat: "Chat",
      tab_tasks: "Tasks",
      new_chat: "New chat",
      new_chat_title: "New conversation",
      message_placeholder: "Write a message",
      send: "Send",
      thinking: "Thinking...",
      ask_model: "Ask the model",
      no_messages: "No messages yet.",
      assistant: "Assistant",
      new_task: "New task",
      task_title: "Task title",
      add_task: "Add task",
      no_tasks: "No tasks yet.",
      state_planned: "Planned",
      state_in_progress: "In progress",
      state_waiting_for_approval: "Waiting for approval",
      state_blocked: "Blocked",
      state_completed: "Completed",
      state_failed: "Failed",
      state_cancelled: "Cancelled",
      memory_title: "Memory",
      memory_hint: "Only confirmed memories are sent to the model. You can edit or delete any of them.",
      memory_text: "What should be remembered?",
      add_memory: "Add memory",
      scope_global: "Everywhere",
      scope_project: "Project",
      kind_preference: "Preference",
      kind_fact: "Fact",
      kind_decision: "Decision",
      kind_context: "Context",
      status_confirmed: "Confirmed",
      status_preference: "Preference",
      status_inferred: "Unconfirmed",
      confirm: "Confirm",
      pin: "Pin",
      unpin: "Unpin",
      edit: "Edit",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      confirm_delete_memory: "Delete this memory permanently?",
      search: "Search",
      no_memories: "No memories yet.",
      models_title: "Models",
      models_intro:
        "The assistant answers through a model you configure: a local one (for example Ollama on your own computer) or a hosted one with your own API key. Whatever the model needs to answer is sent to it.",
      no_models: "No model yet. Add one to get answers in the chat.",
      provider_name: "Name",
      provider_kind: "Type",
      kind_local: "Local",
      kind_hosted: "Hosted (own key)",
      provider_url: "Address (ending in /v1)",
      provider_model: "Model name",
      provider_key: "API key (optional for local models)",
      add_model: "Add model",
      default_badge: "Default",
      has_key: "Key saved",
      set_default: "Make default",
      preset_ollama: "Fill in for Ollama",
      err_generic: "Something went wrong.",
      err_network: "Could not reach the server.",
      err_invalid_credentials: "Wrong passphrase.",
      err_too_many: "Too many attempts. Try again in a few minutes.",
      err_validation: "Please check the entered values.",
      err_no_provider: "No model is configured. Add one in the Models tab.",
      err_nothing_to_answer: "Nothing to answer yet. Write a message first.",
      err_empty: "The conversation is empty.",
      err_model: "The model did not answer",
      err_key_https: "An API key can only be sent over HTTPS (or to localhost).",
      err_bad_url: "The address is not valid.",
      err_transition: "That status change is not allowed.",
      err_unreadable_key: "The saved key cannot be read. Enter the key again.",
      err_configured: "A passphrase is already set. Sign in instead.",
    },
    ru: {
      banner: "Ранний прототип, не готовый продукт.",
      loading: "Загрузка...",
      retry: "Повторить",
      back: "Назад",
      sign_out: "Выйти",
      setup_title: "Придумайте парольную фразу",
      login_title: "Вход",
      passphrase: "Парольная фраза",
      passphrase_confirm: "Повторите фразу",
      passphrase_hint:
        "Не меньше 12 символов. Восстановления нет: если забудете, базу придётся удалить.",
      setup_warning:
        "Фразу выбирает тот, кто первым откроет эту страницу. Сделайте это сами, прежде чем давать кому-то доступ.",
      mismatch: "Фразы не совпадают.",
      sign_in: "Войти",
      create: "Создать",
      nav_projects: "Проекты",
      nav_memory: "Память",
      nav_models: "Модели",
      projects_title: "Проекты",
      new_project: "Новый проект",
      project_name: "Название проекта",
      project_goal: "Цель (необязательно)",
      create_project: "Создать проект",
      no_projects: "Проектов пока нет. Создайте первый.",
      delete_project: "Удалить проект",
      confirm_delete_project: "Удалить проект вместе с задачами, чатами и памятью проекта?",
      tab_chat: "Чат",
      tab_tasks: "Задачи",
      new_chat: "Новый чат",
      new_chat_title: "Новый диалог",
      message_placeholder: "Напишите сообщение",
      send: "Отправить",
      thinking: "Думаю...",
      ask_model: "Спросить модель",
      no_messages: "Сообщений пока нет.",
      assistant: "Ассистент",
      new_task: "Новая задача",
      task_title: "Название задачи",
      add_task: "Добавить задачу",
      no_tasks: "Задач пока нет.",
      state_planned: "Запланирована",
      state_in_progress: "В работе",
      state_waiting_for_approval: "Ждёт подтверждения",
      state_blocked: "Заблокирована",
      state_completed: "Выполнена",
      state_failed: "Не удалась",
      state_cancelled: "Отменена",
      memory_title: "Память",
      memory_hint:
        "Модели отправляются только подтверждённые записи. Любую запись можно изменить или удалить.",
      memory_text: "Что нужно запомнить?",
      add_memory: "Добавить запись",
      scope_global: "Везде",
      scope_project: "Проект",
      kind_preference: "Предпочтение",
      kind_fact: "Факт",
      kind_decision: "Решение",
      kind_context: "Контекст",
      status_confirmed: "Подтверждено",
      status_preference: "Предпочтение",
      status_inferred: "Не подтверждено",
      confirm: "Подтвердить",
      pin: "Закрепить",
      unpin: "Открепить",
      edit: "Изменить",
      save: "Сохранить",
      cancel: "Отмена",
      delete: "Удалить",
      confirm_delete_memory: "Удалить запись навсегда?",
      search: "Поиск",
      no_memories: "Записей пока нет.",
      models_title: "Модели",
      models_intro:
        "Ассистент отвечает через модель, которую вы настроите: локальную (например Ollama на вашем компьютере) или облачную со своим API-ключом. Всё, что нужно модели для ответа, отправляется ей.",
      no_models: "Модели пока нет. Добавьте её, чтобы чат отвечал.",
      provider_name: "Название",
      provider_kind: "Тип",
      kind_local: "Локальная",
      kind_hosted: "Облачная (свой ключ)",
      provider_url: "Адрес (оканчивается на /v1)",
      provider_model: "Название модели",
      provider_key: "API-ключ (для локальных необязателен)",
      add_model: "Добавить модель",
      default_badge: "По умолчанию",
      has_key: "Ключ сохранён",
      set_default: "Сделать основной",
      preset_ollama: "Заполнить для Ollama",
      err_generic: "Что-то пошло не так.",
      err_network: "Не удалось связаться с сервером.",
      err_invalid_credentials: "Неверная парольная фраза.",
      err_too_many: "Слишком много попыток. Попробуйте через несколько минут.",
      err_validation: "Проверьте введённые значения.",
      err_no_provider: "Модель не настроена. Добавьте её на вкладке «Модели».",
      err_nothing_to_answer: "Пока нечего отвечать. Сначала напишите сообщение.",
      err_empty: "Диалог пуст.",
      err_model: "Модель не ответила",
      err_key_https: "API-ключ можно отправлять только по HTTPS (или на localhost).",
      err_bad_url: "Адрес указан неверно.",
      err_transition: "Такое изменение статуса недопустимо.",
      err_unreadable_key: "Сохранённый ключ не читается. Введите ключ заново.",
      err_configured: "Фраза уже задана. Войдите.",
    },
  };

  const lang = String(navigator.language || "en").toLowerCase().startsWith("ru") ? "ru" : "en";
  const t = (key) => STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  document.documentElement.lang = lang;

  const TRANSITIONS = {
    planned: ["in_progress", "cancelled"],
    in_progress: ["waiting_for_approval", "blocked", "completed", "failed", "cancelled"],
    waiting_for_approval: ["in_progress", "blocked", "cancelled"],
    blocked: ["in_progress", "cancelled"],
    failed: ["planned"],
    completed: [],
    cancelled: [],
  };

  // ---- Small helpers ----

  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value === false || value === null || value === undefined) continue;
      if (key === "class") el.className = value;
      else if (key.startsWith("on") && typeof value === "function") {
        el.addEventListener(key.slice(2), value);
      } else if (key === "value") el.value = value;
      else if (key === "checked") el.checked = Boolean(value);
      else if (key === "hidden") el.hidden = Boolean(value);
      else el.setAttribute(key, value === true ? "" : String(value));
    }
    for (const child of children.flat()) {
      if (child === null || child === undefined || child === false) continue;
      el.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return el;
  }

  class ApiError extends Error {
    constructor(status, code, data) {
      super(code);
      this.status = status;
      this.code = code;
      this.data = data;
    }
  }

  const root = document.getElementById("app");
  const state = {
    configured: null,
    authenticated: false,
    view: "projects",
    projectId: null,
    projectTab: "chat",
    conversationId: null,
    memoryQuery: "",
  };
  let renderId = 0;

  async function api(method, path, body) {
    const init = { method, headers: {}, credentials: "same-origin" };
    if (body !== undefined) {
      init.headers["content-type"] = "application/json";
      init.body = JSON.stringify(body);
    }
    let res;
    try {
      res = await fetch(path, init);
    } catch {
      throw new ApiError(0, "network");
    }
    if (res.status === 401 && !path.startsWith("/auth/")) {
      state.authenticated = false;
      render();
      throw new ApiError(401, "unauthorized");
    }
    if (res.status === 204) return null;
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) throw new ApiError(res.status, (data && data.error) || "error", data);
    return data;
  }

  function errorMessage(error) {
    if (!(error instanceof ApiError)) return t("err_generic");
    switch (error.code) {
      case "network":
        return t("err_network");
      case "invalid_credentials":
        return t("err_invalid_credentials");
      case "too_many_attempts":
        return t("err_too_many");
      case "validation_error":
        return t("err_validation");
      case "no_provider_configured":
        return t("err_no_provider");
      case "nothing_to_answer":
        return t("err_nothing_to_answer");
      case "empty_conversation":
        return t("err_empty");
      case "model_unavailable": {
        const reason = error.data && error.data.reason ? ` (${error.data.reason})` : "";
        return `${t("err_model")}${reason}`;
      }
      case "key_requires_https":
        return t("err_key_https");
      case "invalid_base_url":
        return t("err_bad_url");
      case "invalid_transition":
        return t("err_transition");
      case "provider_key_unreadable":
        return t("err_unreadable_key");
      case "already_configured":
        return t("err_configured");
      default:
        return t("err_generic");
    }
  }

  let toastTimer = null;
  function toast(message) {
    let el = document.getElementById("toast");
    if (!el) {
      el = h("div", { id: "toast", class: "toast", role: "status" });
      document.body.append(el);
    }
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.hidden = true;
    }, 6000);
  }

  // Wraps an event handler so that failures show a message instead of being lost.
  const act = (fn) => async (event) => {
    try {
      await fn(event);
    } catch (error) {
      toast(errorMessage(error));
    }
  };

  function go(patch) {
    Object.assign(state, patch);
    render();
  }

  function mount(...nodes) {
    root.replaceChildren(...nodes);
  }

  // ---- Rendering ----

  async function render() {
    const id = ++renderId;
    try {
      if (state.configured === null || !state.authenticated) {
        const status = await api("GET", "/auth/status");
        if (id !== renderId) return;
        state.configured = status.configured;
        state.authenticated = status.authenticated;
      }
      if (!state.authenticated) {
        mount(authView());
        return;
      }
      const content = await currentView();
      if (id !== renderId) return;
      mount(shell(content));
    } catch (error) {
      if (id !== renderId) return;
      mount(
        h(
          "div",
          { class: "page" },
          h("p", { class: "error" }, errorMessage(error)),
          h("button", { class: "btn", onclick: () => render() }, t("retry")),
        ),
      );
    }
  }

  function currentView() {
    switch (state.view) {
      case "project":
        return projectView();
      case "memory":
        return memoryView();
      case "models":
        return modelsView();
      default:
        return projectsView();
    }
  }

  function shell(content) {
    const tab = (view, label) =>
      h(
        "button",
        {
          class: `nav-btn${state.view === view || (view === "projects" && state.view === "project") ? " active" : ""}`,
          onclick: () => go({ view, projectId: null, conversationId: null }),
        },
        label,
      );
    return h(
      "div",
      { class: "shell" },
      h(
        "header",
        { class: "topbar" },
        h("strong", { class: "brand" }, "LifeOS"),
        h("span", { class: "banner" }, t("banner")),
        h(
          "button",
          {
            class: "link",
            onclick: act(async () => {
              await api("POST", "/auth/logout", {});
              state.authenticated = false;
              state.view = "projects";
              render();
            }),
          },
          t("sign_out"),
        ),
      ),
      h("main", { class: "content" }, content),
      h(
        "nav",
        { class: "bottom-nav" },
        tab("projects", t("nav_projects")),
        tab("memory", t("nav_memory")),
        tab("models", t("nav_models")),
      ),
    );
  }

  function field(label, input) {
    return h("label", { class: "field" }, h("span", {}, label), input);
  }

  function select(options, current) {
    const el = h("select", {});
    for (const [value, label] of options) {
      const option = h("option", { value }, label);
      if (value === current) option.selected = true;
      el.append(option);
    }
    return el;
  }

  // ---- Sign in / first-run setup ----

  function authView() {
    const setup = state.configured === false;
    const pass = h("input", {
      type: "password",
      required: true,
      autocomplete: setup ? "new-password" : "current-password",
      minlength: setup ? "12" : null,
      maxlength: "200",
    });
    const repeat = setup
      ? h("input", { type: "password", required: true, autocomplete: "new-password", maxlength: "200" })
      : null;
    const message = h("p", { class: "error", hidden: true });

    const submit = async (event) => {
      event.preventDefault();
      message.hidden = true;
      if (setup && pass.value !== repeat.value) {
        message.textContent = t("mismatch");
        message.hidden = false;
        return;
      }
      try {
        await api("POST", setup ? "/auth/setup" : "/auth/login", { passphrase: pass.value });
        pass.value = "";
        state.authenticated = true;
        state.configured = true;
        render();
      } catch (error) {
        message.textContent = errorMessage(error);
        message.hidden = false;
      }
    };

    return h(
      "div",
      { class: "auth" },
      h(
        "form",
        { class: "card auth-card", onsubmit: submit },
        h("h1", {}, "LifeOS"),
        h("h2", {}, setup ? t("setup_title") : t("login_title")),
        field(t("passphrase"), pass),
        repeat ? field(t("passphrase_confirm"), repeat) : null,
        setup ? h("p", { class: "hint" }, t("passphrase_hint")) : null,
        setup ? h("p", { class: "warning" }, t("setup_warning")) : null,
        message,
        h("button", { class: "btn primary", type: "submit" }, setup ? t("create") : t("sign_in")),
        h("p", { class: "hint" }, t("banner")),
      ),
    );
  }

  // ---- Projects ----

  async function projectsView() {
    const projects = await api("GET", "/projects?status=active");
    const name = h("input", { required: true, maxlength: "200" });
    const goal = h("textarea", { rows: "2", maxlength: "10000" });
    const create = act(async (event) => {
      event.preventDefault();
      const project = await api("POST", "/projects", { name: name.value, goal: goal.value });
      go({ view: "project", projectId: project.id, projectTab: "chat", conversationId: null });
    });

    return h(
      "div",
      { class: "page" },
      h("h1", {}, t("projects_title")),
      projects.length === 0
        ? h("p", { class: "empty" }, t("no_projects"))
        : h(
            "div",
            { class: "list" },
            projects.map((project) =>
              h(
                "button",
                {
                  class: "card clickable",
                  onclick: () => go({ view: "project", projectId: project.id, projectTab: "chat", conversationId: null }),
                },
                h("strong", {}, project.name),
                project.goal ? h("span", { class: "muted" }, project.goal) : null,
              ),
            ),
          ),
      h(
        "form",
        { class: "card", onsubmit: create },
        h("h2", {}, t("new_project")),
        field(t("project_name"), name),
        field(t("project_goal"), goal),
        h("button", { class: "btn primary", type: "submit" }, t("create_project")),
      ),
    );
  }

  async function projectView() {
    const project = await api("GET", `/projects/${state.projectId}`);
    const tabButton = (tab, label) =>
      h(
        "button",
        { class: `tab${state.projectTab === tab ? " active" : ""}`, onclick: () => go({ projectTab: tab }) },
        label,
      );
    const body = state.projectTab === "tasks" ? await tasksTab(project) : await chatTab(project);

    return h(
      "div",
      { class: "page" },
      h("button", { class: "link", onclick: () => go({ view: "projects", projectId: null }) }, `< ${t("back")}`),
      h("h1", {}, project.name),
      project.goal ? h("p", { class: "muted" }, project.goal) : null,
      h("div", { class: "tabs" }, tabButton("chat", t("tab_chat")), tabButton("tasks", t("tab_tasks"))),
      body,
      h(
        "button",
        {
          class: "btn danger",
          onclick: act(async () => {
            if (!confirm(t("confirm_delete_project"))) return;
            await api("DELETE", `/projects/${project.id}`);
            go({ view: "projects", projectId: null, conversationId: null });
          }),
        },
        t("delete_project"),
      ),
    );
  }

  // ---- Chat ----

  async function chatTab(project) {
    const conversations = await api("GET", `/projects/${project.id}/conversations?archived=false`);
    if (!conversations.some((c) => c.id === state.conversationId)) {
      state.conversationId = conversations.length > 0 ? conversations[0].id : null;
    }
    const titleOf = (c) => (c.title === "New conversation" ? t("new_chat_title") : c.title);

    const createConversation = async () => {
      const conversation = await api("POST", `/projects/${project.id}/conversations`, {});
      state.conversationId = conversation.id;
      return conversation;
    };

    const chips = h(
      "div",
      { class: "chips" },
      conversations.map((c) =>
        h(
          "button",
          { class: `chip-btn${c.id === state.conversationId ? " active" : ""}`, onclick: () => go({ conversationId: c.id }) },
          titleOf(c),
        ),
      ),
      h(
        "button",
        {
          class: "chip-btn",
          onclick: act(async () => {
            await createConversation();
            render();
          }),
        },
        `+ ${t("new_chat")}`,
      ),
    );

    const list = h("div", { class: "messages" });
    let lastRole = null;
    const bubble = (message) =>
      h(
        "div",
        { class: `bubble ${message.role}` },
        h("div", { class: "bubble-text" }, message.content),
        message.role === "assistant" && message.model_ref
          ? h("div", { class: "bubble-meta" }, `${t("assistant")}: ${message.model_ref}`)
          : null,
      );

    if (state.conversationId) {
      const messages = await api("GET", `/conversations/${state.conversationId}/messages`);
      for (const message of messages) list.append(bubble(message));
      lastRole = messages.length > 0 ? messages[messages.length - 1].role : null;
      if (messages.length === 0) list.append(h("p", { class: "empty" }, t("no_messages")));
    } else {
      list.append(h("p", { class: "empty" }, t("no_messages")));
    }

    const input = h("textarea", { rows: "2", maxlength: "50000", placeholder: t("message_placeholder") });
    const sendButton = h("button", { class: "btn primary", type: "submit" }, t("send"));
    const askButton = h("button", { class: "btn", type: "button", hidden: lastRole !== "user" }, t("ask_model"));

    const scrollDown = () => {
      if (typeof list.scrollTo === "function") list.scrollTo(0, list.scrollHeight);
    };

    const askModel = async () => {
      const pending = h("div", { class: "bubble assistant pending" }, t("thinking"));
      list.append(pending);
      scrollDown();
      try {
        const reply = await api("POST", `/conversations/${state.conversationId}/reply`, {});
        pending.replaceWith(bubble(reply));
        lastRole = "assistant";
      } catch (error) {
        pending.remove();
        throw error;
      } finally {
        askButton.hidden = lastRole !== "user";
        scrollDown();
      }
    };

    const setBusy = (busy) => {
      sendButton.disabled = busy;
      askButton.disabled = busy;
    };

    const send = act(async (event) => {
      event.preventDefault();
      const content = input.value.trim();
      if (!content) return;
      setBusy(true);
      try {
        if (!state.conversationId) await createConversation();
        const message = await api("POST", `/conversations/${state.conversationId}/messages`, { content });
        input.value = "";
        for (const empty of list.querySelectorAll(".empty")) empty.remove();
        list.append(bubble(message));
        lastRole = "user";
        await askModel();
      } finally {
        askButton.hidden = lastRole !== "user";
        setBusy(false);
      }
    });

    askButton.addEventListener(
      "click",
      act(async () => {
        setBusy(true);
        try {
          await askModel();
        } finally {
          setBusy(false);
        }
      }),
    );

    return h(
      "div",
      { class: "chat" },
      chips,
      list,
      h("form", { class: "composer", onsubmit: send }, input, h("div", { class: "row" }, askButton, sendButton)),
    );
  }

  // ---- Tasks ----

  async function tasksTab(project) {
    const tasks = await api("GET", `/projects/${project.id}/tasks`);
    const title = h("input", { required: true, maxlength: "300", placeholder: t("task_title") });
    const add = act(async (event) => {
      event.preventDefault();
      await api("POST", `/projects/${project.id}/tasks`, { title: title.value });
      render();
    });

    return h(
      "div",
      {},
      tasks.length === 0
        ? h("p", { class: "empty" }, t("no_tasks"))
        : h(
            "div",
            { class: "list" },
            tasks.map((task) =>
              h(
                "div",
                { class: "card" },
                h("div", { class: "row between" }, h("strong", {}, task.title), h("span", { class: `chip state-${task.state}` }, t(`state_${task.state}`))),
                task.description ? h("p", { class: "muted" }, task.description) : null,
                h(
                  "div",
                  { class: "row wrap" },
                  (TRANSITIONS[task.state] || []).map((next) =>
                    h(
                      "button",
                      {
                        class: "btn small",
                        onclick: act(async () => {
                          await api("POST", `/tasks/${task.id}/transition`, { to: next });
                          render();
                        }),
                      },
                      t(`state_${next}`),
                    ),
                  ),
                ),
              ),
            ),
          ),
      h(
        "form",
        { class: "card", onsubmit: add },
        h("h2", {}, t("new_task")),
        title,
        h("button", { class: "btn primary", type: "submit" }, t("add_task")),
      ),
    );
  }

  // ---- Memory ----

  async function memoryView() {
    const query = state.memoryQuery ? `?q=${encodeURIComponent(state.memoryQuery)}` : "";
    const [memories, projects] = await Promise.all([api("GET", `/memories${query}`), api("GET", "/projects")]);
    const projectName = new Map(projects.map((p) => [p.id, p.name]));

    const search = h("input", { type: "search", value: state.memoryQuery, placeholder: t("search"), maxlength: "200" });
    const searchForm = h(
      "form",
      {
        class: "row",
        onsubmit: (event) => {
          event.preventDefault();
          go({ memoryQuery: search.value.trim() });
        },
      },
      search,
      h("button", { class: "btn", type: "submit" }, t("search")),
    );

    const text = h("textarea", { rows: "2", required: true, maxlength: "5000", placeholder: t("memory_text") });
    const kind = select(
      ["preference", "fact", "decision", "context"].map((k) => [k, t(`kind_${k}`)]),
      "fact",
    );
    const scope = select(
      [["global", t("scope_global")], ...projects.map((p) => [`project:${p.id}`, `${t("scope_project")}: ${p.name}`])],
      "global",
    );
    const add = act(async (event) => {
      event.preventDefault();
      const body = { text: text.value, kind: kind.value };
      if (scope.value === "global") body.scope = "global";
      else {
        body.scope = "project";
        body.project_id = scope.value.slice("project:".length);
      }
      await api("POST", "/memories", body);
      render();
    });

    const card = (memory) => {
      const box = h("div", { class: "card" });
      const show = () => {
        const where = memory.project_id ? projectName.get(memory.project_id) || t("scope_project") : t("scope_global");
        box.replaceChildren(
          h("p", { class: "memory-text" }, memory.text),
          h(
            "div",
            { class: "row wrap" },
            h("span", { class: "chip" }, where),
            h("span", { class: "chip" }, t(`kind_${memory.kind}`)),
            h("span", { class: `chip status-${memory.status}` }, t(`status_${memory.status}`)),
            memory.pinned ? h("span", { class: "chip" }, t("pin")) : null,
          ),
          h(
            "div",
            { class: "row wrap" },
            memory.status === "inferred"
              ? h(
                  "button",
                  {
                    class: "btn small",
                    onclick: act(async () => {
                      await api("PATCH", `/memories/${memory.id}`, { status: "confirmed" });
                      render();
                    }),
                  },
                  t("confirm"),
                )
              : null,
            h(
              "button",
              {
                class: "btn small",
                onclick: act(async () => {
                  await api("PATCH", `/memories/${memory.id}`, { pinned: !memory.pinned });
                  render();
                }),
              },
              memory.pinned ? t("unpin") : t("pin"),
            ),
            h("button", { class: "btn small", onclick: () => edit() }, t("edit")),
            h(
              "button",
              {
                class: "btn small danger",
                onclick: act(async () => {
                  if (!confirm(t("confirm_delete_memory"))) return;
                  await api("DELETE", `/memories/${memory.id}`);
                  render();
                }),
              },
              t("delete"),
            ),
          ),
        );
      };
      const edit = () => {
        const area = h("textarea", { rows: "3", maxlength: "5000", value: memory.text });
        box.replaceChildren(
          area,
          h(
            "div",
            { class: "row" },
            h(
              "button",
              {
                class: "btn primary small",
                onclick: act(async () => {
                  await api("PATCH", `/memories/${memory.id}`, { text: area.value });
                  render();
                }),
              },
              t("save"),
            ),
            h("button", { class: "btn small", onclick: () => show() }, t("cancel")),
          ),
        );
      };
      show();
      return box;
    };

    return h(
      "div",
      { class: "page" },
      h("h1", {}, t("memory_title")),
      h("p", { class: "hint" }, t("memory_hint")),
      searchForm,
      memories.length === 0 ? h("p", { class: "empty" }, t("no_memories")) : h("div", { class: "list" }, memories.map(card)),
      h(
        "form",
        { class: "card", onsubmit: add },
        h("h2", {}, t("add_memory")),
        text,
        field(t("scope_project"), scope),
        field(t("kind_fact"), kind),
        h("button", { class: "btn primary", type: "submit" }, t("add_memory")),
      ),
    );
  }

  // ---- Models ----

  async function modelsView() {
    const providers = await api("GET", "/providers");
    const name = h("input", { required: true, maxlength: "100" });
    const kind = select(
      [
        ["local", t("kind_local")],
        ["hosted", t("kind_hosted")],
      ],
      "local",
    );
    const url = h("input", { required: true, maxlength: "500", placeholder: "http://127.0.0.1:11434/v1" });
    const model = h("input", { required: true, maxlength: "200" });
    const key = h("input", { type: "password", autocomplete: "off", maxlength: "500" });

    const add = act(async (event) => {
      event.preventDefault();
      const body = { name: name.value, kind: kind.value, base_url: url.value, model: model.value };
      if (key.value) body.api_key = key.value;
      await api("POST", "/providers", body);
      key.value = "";
      render();
    });

    return h(
      "div",
      { class: "page" },
      h("h1", {}, t("models_title")),
      h("p", { class: "hint" }, t("models_intro")),
      providers.length === 0
        ? h("p", { class: "empty" }, t("no_models"))
        : h(
            "div",
            { class: "list" },
            providers.map((provider) =>
              h(
                "div",
                { class: "card" },
                h("div", { class: "row between" }, h("strong", {}, provider.name), provider.is_default ? h("span", { class: "chip" }, t("default_badge")) : null),
                h("p", { class: "muted" }, `${provider.model} - ${provider.base_url}`),
                h(
                  "div",
                  { class: "row wrap" },
                  h("span", { class: "chip" }, provider.kind === "local" ? t("kind_local") : t("kind_hosted")),
                  provider.has_key ? h("span", { class: "chip" }, t("has_key")) : null,
                ),
                h(
                  "div",
                  { class: "row wrap" },
                  provider.is_default
                    ? null
                    : h(
                        "button",
                        {
                          class: "btn small",
                          onclick: act(async () => {
                            await api("PATCH", `/providers/${provider.id}`, { is_default: true });
                            render();
                          }),
                        },
                        t("set_default"),
                      ),
                  h(
                    "button",
                    {
                      class: "btn small danger",
                      onclick: act(async () => {
                        if (!confirm(t("confirm_delete_memory"))) return;
                        await api("DELETE", `/providers/${provider.id}`);
                        render();
                      }),
                    },
                    t("delete"),
                  ),
                ),
              ),
            ),
          ),
      h(
        "form",
        { class: "card", onsubmit: add },
        h("h2", {}, t("add_model")),
        h(
          "button",
          {
            class: "btn small",
            type: "button",
            onclick: () => {
              name.value = "Ollama";
              kind.value = "local";
              url.value = "http://127.0.0.1:11434/v1";
            },
          },
          t("preset_ollama"),
        ),
        field(t("provider_name"), name),
        field(t("provider_kind"), kind),
        field(t("provider_url"), url),
        field(t("provider_model"), model),
        field(t("provider_key"), key),
        h("button", { class: "btn primary", type: "submit" }, t("add_model")),
      ),
    );
  }

  render();
})();
