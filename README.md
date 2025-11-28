# Headset Mic Checker

A simple, mobile-friendly web application to test and compare the microphone quality of different headsets for speech recognition.

## Features

- **Speech Recognition Testing**: Uses the Web Speech API to transcribe your voice
- **Quality Scoring**: Calculates accuracy scores for each reading
- **Issue Analysis**: Identifies potential problems like background noise, dropouts, or clarity issues
- **Environment Tracking**: Label and compare performance across different recording environments
- **Comparison Table**: View and compare multiple headsets and environments
- **Mobile-Friendly**: Responsive design works on phones, tablets, and desktops
- **Accessible**: Built with WCAG guidelines in mind

## How to Use

1. **Enter your headset name** (e.g., "Logitech H390")
2. **Select your environment** (e.g., "Quiet Room", "Office")
3. **Click "Start Recording"** and read the paragraph aloud
4. **Repeat 3 times** for a complete test
5. **View your results** including average score and individual readings
6. **Compare** different headsets and environments in the comparison table

## Browser Support

This application works best in:
- Chrome (desktop and Android)
- Edge (desktop)

Other browsers may not support the Web Speech API and will show a compatibility warning.

## Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern, responsive styling
- **Vanilla JavaScript** - No frameworks required
- **Web Speech API** - Browser-based speech recognition

## Scoring System

- **Excellent**: 90%+ accuracy
- **Good**: 75-89% accuracy
- **Fair**: 60-74% accuracy
- **Poor**: Below 60% accuracy

## Privacy

No audio is recorded or stored. All processing happens in your browser using the Web Speech API. Transcripts and scores are stored temporarily in memory and are cleared when you refresh the page.

## Development

This is a static web application with no build process required. Simply open `index.html` in a supported browser to run locally.

## License

MIT License - Feel free to use and modify as needed.
