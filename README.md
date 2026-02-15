# Michael Zenkay Personal Website

Personal portfolio site at `michaelzenkay.github.io`

## Setup

1. Create a new GitHub repo named `michaelzenkay.github.io` (must match your username exactly)
2. Upload all files from this directory
3. Go to repo Settings > Pages and set source to "main" branch
4. Site will be live at `https://michaelzenkay.github.io`

## Structure

```
michaelzenkay.github.io/
├── index.html              # Landing page
├── style.css               # Main stylesheet
├── presentations/
│   └── quantitative-imaging/
│       └── index.html      # Reveal.js presentation
└── README.md              # This file
```

## Adding Content

### Adding a Presentation

1. Create folder: `presentations/your-talk-name/`
2. Add `index.html` (copy from quantitative-imaging as template)
3. Update landing page with link:

```html
<li>
    <a href="presentations/your-talk-name/">
        <h3>Your Title</h3>
        <p>Description</p>
        <span class="date">Date</span>
    </a>
</li>
```

### Adding Your Dissertation

1. Create folder: `dissertation/`
2. Add PDF or convert to HTML
3. Update landing page

### Customizing

- Edit `style.css` for colors/fonts
- Modify Reveal.js theme in presentation index.html
- Update header/footer in index.html

## Keyboard Shortcuts for Presentations

- **Arrow keys**: Navigate slides
- **Space**: Next slide
- **ESC**: Overview mode
- **?**: Show all shortcuts
- **F**: Fullscreen

## Technologies

- Reveal.js 4.5.0 for presentations
- Pure HTML/CSS (no build step needed)
- GitHub Pages for hosting
