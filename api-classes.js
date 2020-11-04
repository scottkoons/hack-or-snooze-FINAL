const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }
  static async getStories() {
    const response = await axios.get(`${BASE_URL}/stories`);
    const stories = response.data.stories.map((story) => new Story(story));
    const storyList = new StoryList(stories);
    return storyList;
  }

  // Create a new Story when user submits a new story
  static async addStory(user, newStory) {
    const response = await axios.post(`${BASE_URL}/stories`, {
      token: user,
      story: newStory,
    });
    return response;
  }
  // ===============================================
  // async removeStory(user, storyId) {
  static async removeStory(user, storyId) {
    await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "DELETE",
      data: {
        token: user,
      },
    });
  }
}

class User {
  constructor(userObj) {
    this.username = userObj.username;
    this.name = userObj.name;
    this.createdAt = userObj.createdAt;
    this.updatedAt = userObj.updatedAt;

    // these are all set to defaults, not passed in by the constructor
    this.loginToken = "";
    this.favorites = [];
    this.ownStories = [];
  }

  // Make POST request & return newly-created user
  static async create(username, password, name) {
    // First check to see if username is already in database
    try {
      const response = await axios.post(`${BASE_URL}/signup`, {
        user: {
          username,
          password,
          name,
        },
      });

      // build a new User instance from the API response
      const newUser = new User(response.data.user);

      // attach the token to the newUser instance for convenience
      newUser.loginToken = response.data.token;
      return newUser;
      // Throw error if username already exists in database
    } catch (err) {
      alert(err.response.data.error.message);
    }
  }

  static async login(username, password) {
    try {
      const response = await axios.post(`${BASE_URL}/login`, {
        user: {
          username,
          password,
        },
      });
      const existingUser = new User(response.data.user); // build a new User instance from the API response

      // instantiate Story instances for the user's favorites and ownStories
      existingUser.favorites = response.data.user.favorites.map(
        (s) => new Story(s)
      );
      existingUser.ownStories = response.data.user.stories.map(
        (s) => new Story(s)
      );

      // attach the tokeƒn to the newUser instance for convenience
      existingUser.loginToken = response.data.token;
      return existingUser;
    } catch (err) {
      // Throw an error if either the username or password it wrong
      if (err.response.data.error.message === "Invalid password.") {
        alert(
          `It says yo password is wrong... Seriously??? You can't remember your password? Please try again.`
        );
      } else if (err.response.data.error.title === "User Not Found") {
        alert(
          `Check your username. ${err.response.data.error.message} Please try again.`
        );
      }
    }
  }

  /** Get user instance for the logged-in-user.
   *
   * This function uses the token & username to make an API request to get details
   *   about the user. Then it creates an instance of user with that info.
   */
  static async getLoggedInUser(token, username) {
    // if we don't have user info, return null
    if (!token || !username) return null;
    const response = await axios.get(`${BASE_URL}/users/${username}`, {
      params: {
        token,
      },
    });

    // instantiate the user from the API information
    const existingUser = new User(response.data.user);
    // attach the token to the newUser instance for convenience
    existingUser.loginToken = token;

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(
      (s) => new Story(s)
    );
    existingUser.ownStories = response.data.user.stories.map(
      (s) => new Story(s)
    );
    return existingUser;
  }

  //Add a story to the list of user favorites and update the API

  async addFavorite(storyId) {
    await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
      method: "POST",
      data: {
        token: this.loginToken,
      },
    });

    // await this.retrieveDetails();
    return this;
  }

  // remove a story

  async removeFavorite(storyId) {
    await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
      method: "DELETE",
      data: {
        // token: token,
        token: this.loginToken,
      },
    });

    // await this.retrieveDetails();
    return this;
  }
}

class Story {
  constructor(storyObj) {
    this.author = storyObj.author;
    this.title = storyObj.title;
    this.url = storyObj.url;
    this.username = storyObj.username;
    this.storyId = storyObj.storyId;
    this.createdAt = storyObj.createdAt;
    this.updatedAt = storyObj.updatedAt;
  }
}

// Bulma modal
class BulmaModal {
  constructor(selector) {
    this.elem = document.querySelector(selector);
    this.close_data();
  }

  show() {
    this.elem.classList.toggle("is-active");
    this.on_show();
  }

  close() {
    this.elem.classList.toggle("is-active");
    this.on_close();
  }

  close_data() {
    let modalClose = this.elem.querySelectorAll(
      "[data-bulma-modal='close'], .modal-background"
    );
    let that = this;
    modalClose.forEach(function (e) {
      e.addEventListener("click", function () {
        that.elem.classList.toggle("is-active");
        let event = new Event("modal:close");
        that.elem.dispatchEvent(event);
      });
    });
  }

  on_show() {
    let event = new Event("modal:show");
    this.elem.dispatchEvent(event);
  }

  on_close() {
    let event = new Event("modal:close");
    this.elem.dispatchEvent(event);
  }

  addEventListener(event, callback) {
    this.elem.addEventListener(event, callback);
  }
}
