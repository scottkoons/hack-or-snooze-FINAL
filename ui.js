// UI
$(async function () {
  const $body = $("body");
  const $allStoriesList = $("#all-articles-list");
  const $onlyStories = $("#only-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $navLogin = $("#nav-login");
  const $navWelcome = $("#nav-welcome");
  const $navUserProfile = $("#nav-user-profile");
  const $navLogOut = $("#nav-logout");
  const $navSubmit = $("#nav-submit");
  const $userProfile = $("#user-profile");
  const $createdAt = $("#profile-created-at");
  const $updatedAt = $("#profile-updated-at");
  const $favoritedStories = $("#favorited-articles");
  const $myFavoritedArticles = $("#my-favorited-articles");

  const $createStoryForm = $("#create-story-form");
  const $ownStories = $("#my-articles");
  const $createTitle = $("#create-story-title");
  const $createURL = $("#create-story-url");
  const $createAuthor = $("#create-story-author");

  const $logoutBtn = $("#logout-btn");

  let token = localStorage.getItem("token");
  let username = localStorage.getItem("username");
  let name = localStorage.getItem("name");
  let created = localStorage.getItem("created");

  // global user variable
  let currentUser = null;

  // Check to see if localStorage is full
  if (localStorage.getItem("name") !== null) {
    $("#profile-name").html(`<b>Name:</b> ${name}`);
    $("#profile-username").html(`<b>Username:</b> ${username}`);
    $("#profile-token").html(`<b>Tokin:</b> ${token}`);
    $("#nav-user-profile").html(`<b>Welcome: </b> ${username}`);
    $("#profile-created-at").html(
      `<b>Account Created: </b>${created.slice(0, 10)}`
    );
    syncCurrentUserToLocalStorage();
  }

  // Hamburger Menu
  $(document).ready(function () {
    // Check for click events on the navbar burger icon
    $(".navbar-burger").click(function () {
      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");
    });
  });

  await checkIfLoggedIn();
  await generateStories();

  $userProfile.hide();

  //Event listener for logging in. If successful, will set up the user instance
  $loginForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page-refresh on submit
    const username = $("#login-username").val();
    const password = $("#login-password").val();
    const userInstance = await User.login(username, password); // Sends collected info to User class static login method

    // set the global user to the user instance
    currentUser = userInstance; // The currentUser is now set to the new User obj created in the api-classes file
    generateProfile(currentUser);
    syncCurrentUserToLocalStorage();
    resetForm();
  });

  //Event listener for signing up. If successful, will setup a new user instance.
  $createAccountForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page refresh
    // grab the required fields
    const name = $("#create-account-name").val();
    const username = $("#create-account-username").val();
    const password = $("#create-account-password").val();

    // call create method, which calls  API and then builds a new user instance
    const newUser = await User.create(username, password, name); // Sends collected info to User class static create method

    currentUser = newUser; // The currentUser is now set to the new User obj created in the api-classes file
    generateProfile(currentUser);
    syncCurrentUserToLocalStorage();
    resetForm();
  });

  //Event listener for adding story
  $createStoryForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page refresh
    if (!token) return; // If no user is loggin in, then nothin is run

    // Get form input values
    const title = $createTitle.val();
    const url = $createURL.val();
    const author = $createAuthor.val();

    let storyInfo = { author: author, title: title, url: url };

    const addedStory = await StoryList.addStory(token, storyInfo);
    generateStories();
    resetForm();
  });

  // Delete user story by clicking delete button
  $(".deleteBtn").click(async function () {
    const storyID = $(this).closest("tr").attr("id");
    $(this).closest("tr").hide();
    const removeStory = await StoryList.removeStory(token, storyID);
    resetForm();
  });

  // Event handler for clicking login/create user in the nav bar. ONLY VISUAL
  $navLogin.on("click", function () {
    $loginForm.slideToggle();
    $("#create-login-hero").slideToggle();
    $("#create-user-title").slideToggle();
    $("#login-user-title").slideToggle();

    $createAccountForm.slideToggle();
    $allStoriesList.toggle(); // Controls the all articles table
    $onlyStories.toggle(); // Controls hero image
  });

  // Log Out Functionality
  $navLogOut.on("click", function () {
    localStorage.clear(); // empty out local storage
    location.reload(); // refresh the page, clearing memory
    clearProfile(currentUser);
    resetForm();
  });

  // Logout from form btn
  $logoutBtn.on("click", function () {
    localStorage.clear(); // empty out local storage
    location.reload(); // refresh the page, clearing memory
    resetForm();
  });

  // Resets form inputs
  function resetForm() {
    $("#login-username").val("");
    $("#login-password").val("");
    $("#create-account-name").val("");
    $("#create-account-username").val("");
    $("#create-account-password").val("");
    $createTitle.val("");
    $createURL.val("");
    $createAuthor.val("");
    location.reload();
  }

  // Clears all profile and user data
  function clearProfile(currentUser) {
    $favoritedStories.empty();
    $ownStories.empty();
    $createdAt.empty();
    $updatedAt.empty();
  }

  //checks local storage to see if the user is already logged in
  async function checkIfLoggedIn() {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    currentUser = await User.getLoggedInUser(token, username);
    if (currentUser) {
      generateProfile(currentUser);
      showNavForLoggedInUser(currentUser.username);
    }
  }

  // Show/Hide nav bar elements. VISUAL ONLY
  function showNavForLoggedInUser() {
    $navLogin.hide();
    $(".main-nav-links, #nav-logout").toggleClass("hidden");
  }

  // Event listener for clicking on logo in the nav bar
  $body.on("click", "#nav-all", async function () {
    location.reload();
    hideElements();
  });

  // Event listener for clicking on SUBMIT in the nav bar
  $navSubmit.on("click", function () {
    hideElements();
    $createStoryForm.slideToggle();
    $("#add-story-hero").slideToggle();
  });

  // Event listener for clicking on FAVORITES in the nav bar
  $("#nav-favorites").on("click", async function () {
    $myFavoritedArticles.empty();
    currentUser = await User.getLoggedInUser(token, username);
    generateProfile(currentUser);
    hideElements();

    $myFavoritedArticles.toggle();
    $("#add-favorite-hero").slideToggle();
  });

  // Event listener for clicking on MY STORIES in the nav bar
  $("#nav-my-stories").on("click", async function () {
    $ownStories.empty();
    storyUser = await User.getLoggedInUser(token, username);
    generateProfile(storyUser);
    hideElements();
    $ownStories.slideToggle();
    $("#add-my-articles-hero").slideToggle();
    // $ownStories.empty();
  });

  function hideElements() {
    const elementsArr = [
      $allStoriesList,
      $onlyStories,
      $ownStories,
      $favoritedStories,
      $loginForm,
      $createAccountForm,
      $userProfile,
      $createStoryForm,
      $("#add-story-hero"),
      $myFavoritedArticles,
      $("#add-favorite-hero"),
      $("#add-my-articles-hero"),
    ];
    elementsArr.forEach(($elem) => $elem.hide());
  }

  /* see if a specific story is in the user's list of favorites */
  function isFavorite(story) {
    let favStoryIds = new Set();
    if (currentUser) {
      favStoryIds = new Set(currentUser.favorites.map((obj) => obj.storyId));
    }
    return favStoryIds.has(story.storyId);
  }

  $(".articles-container").on("click", ".star", async function (evt) {
    if (currentUser) {
      const $evtTarget = $(evt.target);
      const storyId = $(this).closest("tr").attr("id");

      if ($evtTarget.hasClass("fas")) {
        await currentUser.removeFavorite(storyId);
        $evtTarget.closest("i").toggleClass("fas far");
      } else {
        await currentUser.addFavorite(storyId);
        $evtTarget.closest("i").toggleClass("fas far");
      }
    }
  });

  $(".articles-container").on("click", ".trash-can", async function (evt) {
    if (currentUser) {
      const $evtTarget = $(evt.target);
      const storyId = $(this).closest("tr").attr("id");
      const user = currentUser.loginToken;
      await StoryList.removeStory(user, storyId);
      $(this).closest("tr").hide();
    }
  });

  /* sync current user information to localStorage */
  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
      localStorage.setItem("name", currentUser.name);
      localStorage.setItem("created", currentUser.createdAt);

      // Displays localStorage information in DOM
      token = localStorage.getItem("token");
      username = localStorage.getItem("username");
      name = localStorage.getItem("name");
      created = localStorage.getItem("created");

      // Print to navbar
      $("#nav-user-profile").html(`<b>Welcome: </b> ${username}`);

      // print to local storage form
      $("#profile-name").html(`<b>Name from storage:</b> ${name}`);
      $("#profile-username").html(`<b>Username:</b> ${username}`);
      $("#profile-token").html(`<b>Token:</b> ${token}`);
      $("#profile-created-at").html(`<b>Account Created:</b> ${created}`);
    }
  }

  async function generateStories() {
    const storyListInstance = await StoryList.getStories();
    storyList = storyListInstance;
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  // Generates user profile & related info
  function generateProfile(currentUser) {
    for (let tagStory of currentUser.favorites) {
      const myFav = generateMyFavoriteStoryHTML(tagStory);
      $myFavoritedArticles.append(myFav);
    }
    for (let myStory of currentUser.ownStories) {
      const myUploads = generateMyStoryHTML(myStory);
      $ownStories.append(myUploads);
    }
  }

  // Renders the HTML for favorited articles
  function generateMyFavoriteStoryHTML(story) {
    let hostName = getHostName(story.url);
    let starType = isFavorite(story) ? "fas" : "far";
    const storyMarkup = $(`
      <tr id="${story.storyId}">
        <td>
          <span class="star">
              <i class="${starType} fa-star"></i>
            </span>
        </td>
        <td>
          <a class="article-link" href="${story.url}" target="a_blank">
            <strong>${story.title}</strong>
          </a>
        </td>
        <td>
          <small class="article-author">by ${story.author}</small>
          <small class="article-hostname ${hostName}">(${hostName})</small>
          <small class="article-username">posted by ${story.username}</small>
        </td>
      </tr>
    `);
    return storyMarkup;
  }

  // Renders the HTML for any list of stories & their related info
  function generateMyStoryHTML(story) {
    let hostName = getHostName(story.url);
    let starType = isFavorite(story) ? "fas" : "far";
    const storyMarkup = $(`
      <tr id="${story.storyId}">
        <td>
          
          <span class="trash-can">
              <i class="fas fa-trash-alt"></i>
            </span>
          <span class="star">
              <i class="${starType} fa-star"></i>
            </span>
        </td>
        <td>
          <a class="article-link" href="${story.url}" target="a_blank">
            <strong>${story.title}</strong>
          </a>
        </td>
        <td>
          <small class="article-author">by ${story.author}</small>
          <small class="article-hostname ${hostName}">(${hostName})</small>
          <small class="article-username">posted by ${story.username}</small>
        </td>
      </tr>
    `);
    return storyMarkup;
  }

  // Renders the HTML for any list of stories & their related info
  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);
    let starType = isFavorite(story) ? "fas" : "far";

    const storyMarkup = $(`
      <tr id="${story.storyId}">
          <td>
            <span class="star">
              <i class="${starType} fa-star"></i>
            </span>
          </td>

          </td>
        <td>
          <a class="article-link" href="${story.url}" target="a_blank">
            <strong>${story.title}</strong>
          </a>
        </td>
        <td>
          <small class="article-author">by ${story.author}</small>
          <small class="article-hostname ${hostName}">(${hostName})</small>
          <small class="article-username">posted by ${story.username}</small>
        </td>
      </tr>
    `);
    return storyMarkup;
  }

  // Splits up story URLs into easily readible URLs for the DOM
  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }
});

// Bulma modal for user profile info
let btn = document.querySelector("#nav-user-profile");
let mdl = new BulmaModal("#myModal");

btn.addEventListener("click", function () {
  mdl.show();
});

mdl.addEventListener("modal:show", function () {});

mdl.addEventListener("modal:close", function () {});
