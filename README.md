<p align="center" width="100%">
    <img alt="Byte-Vision" src="/ReadMeAssets/Logo.png"> 
</p>

# Byte-Vision <i>beta</i>

#### What is Byte-Vision? Byte-Vision is a llama.cpp testing/workflow GUI application. It is written in Go and uses the Wails framework. The tool was developed to facilitate the tracking of test runs and the easy saving of llama.cpp settings. Existing Python packages did not meet these requirements. The project aims to help other developers understand how llama.cpp functions by providing a straightforward flat project. Llama.cpp offers numerous parameters, and this Go application enables quick model switches, setting changes, and version swaps. Completions and settings are saved in a database, allowing for result comparisons and workflow-specific testing tracking.

# Table of Contents

1. [Quick tour of GUI](#Tour)
2. [Built with](#Built-with)
3. [Installing and running application in dev.](#Installing-and-running-application-in-dev)
4. [Roadmap](#Roadmap)
5. [Contributing](#Contributing)
6. [License](#License)
7. [Contact](#Contact)

## Tour of interface features.

### Main screen with menu and inference screen.  
![img.png](ReadMeAssets/img.png)

### Settings screen, settings for llama-cli, llama-embedding and various logs.
#### Llama-cli parameters
![Llama-Cli](ReadMeAssets/img_1.png)

#### Lama-embedding parameters
![Llama-Embedding](ReadMeAssets/img_2.png)

#### Llama-cli inference model log.
![Logs](ReadMeAssets/img_3.png)

### Embedding screen, settings for CSV embedding, text embedding and document parser.
#### Doc parser setup.
![Doc parser](ReadMeAssets/img_4.png)

#### CSV embedding query.
![CSV Embedding](ReadMeAssets/img_5.png)

#### Text embedding query.
![Text Embedding](ReadMeAssets/img_6.png)

### Inference history and compare screen.
#### Inference history viewer.
![Inference History](ReadMeAssets/img_7.png)

#### Completion diff example.
![Completion Diff](ReadMeAssets/img_8.png)
<p align="right">(<a href="#top">back to top</a>)</p>

## Built with
* [Wails](https://github.com/wailsapp/wails)
* [Llamacpp](https://github.com/ggml-org/llama.cpp)
* [Chromen-Go](github.com/philippgille/chromem-go)
* [React](https://react.dev/)
* [Go SQL Lite](github.com/mattn/go-sqlite3)
* [Bootstrap 5](https://getbootstrap.com)
* [Go-Diff](github.com/sergi/go-diff)

<p align="right">(<a href="#top">back to top</a>)</p>

## Installing and running application in dev
To-do

## Roadmap
The feature list is the following
Finish saving llama-cli settings.
Finish saving llama-embedding settings.
Finish how-to docs and examples.

See the [open issues](https://github.com/kbrisso/file-base/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#top">back to top</a>)</p>

## Contributing
Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#top">back to top</a>)</p>

## License
GNU General Public License v3.0

<p align="right">(<a href="#top">back to top</a>)</p>

## Contact

Kevin Brisson - [LinkedIn](https://www.linkedin.com/in/kevin-brisson-918445185/) - kbrisso@gmail.com
Project Link: [https://github.com/kbrisso/byte-vision](https://github.com/kbrisso/file-base)

<p align="right">(<a href="#top">back to top</a>)</p>





