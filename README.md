# BGMan - Board Game Collection Manager Bot

BGMan is a simple Discord bot that helps users manage their board game collections and wishlists. With intuitive commands, users can easily add or remove games, view their collection, and manage their wishlist in any Discord server.

## Features

### 1. **Add Games to Your Collection**

Easily add board games to your personal collection.

**Slash Command:**

```
/add collection <game_id>
```

- Adds the specified game to the user’s collection, checking if it’s already there.

### 2. **Add Games to Your Wishlist**

Keep track of games you want to own or play by adding them to your wishlist.

**Slash Command:**

```
/add wishlist <game_id>
```

- Adds the game to the user’s wishlist.

### 3. **Remove Games from Your Collection**

Remove games from your collection when you no longer own them.

**Slash Command:**

```
/remove collection <game_id>
```

- Removes the specified game from the user’s collection.

### 4. **Remove Games from Your Wishlist**

Keep your wishlist up-to-date by removing games you’ve acquired or lost interest in.

**Slash Command:**

```
/remove wishlist <game_id>
```

- Removes the game from the user’s wishlist.

### 5. **View Your Collection**

See a list of all the games you currently own.

**Slash Command:**

```
/list collection
```

- Displays the user’s collection of games.

### 6. **View Your Wishlist**

View all the games on your wishlist to track games you want.

**Slash Command:**

```
/list wishlist
```

- Displays the user’s wishlist.

### 7. **Find Owners of a Specific Game**

Check who else in the server owns a specific game.

**Slash Command:**

```
/owners <game_id>
```

- Lists all users who own the specified game.

### 8. **Display Server Collection**

View all the games owned by users in the server.

**Slash Command:**

```
/server collection
```

- Shows the combined collection of all server members.

### 9. **Display Server Wishlist**

See what games the server’s users are interested in.

**Slash Command:**

```
/server wishlist
```

- Shows the wishlist of all server members.

### 10. **Game Recommendations**

BGMan can suggest board games based on what’s popular in the server’s collection or wishlist.

**Slash Command:**

```
/recommend
```

- Provides game recommendations based on server activity.
