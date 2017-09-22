# metal-a11y-checker
An automated accessibility checker

Automated accessibility test module that as opposed to many static anylisis tools in existence, employs headless browser environment through `puppeteer` in order to render the target components in A way they would eventually appear in the consuming service and test them with `axe-core` against accessibility violations. With this approach developers can get more accurate report whether their yet-to-be-preprocessed content such as JSX will conform to accessibility standards.

![ezgif com-video-to-gif](https://user-images.githubusercontent.com/6104164/30703545-4d00ea22-9ef0-11e7-9571-51e0b8313516.gif)

## Setup

1. Install NodeJS >= v0.12.0 and NPM >= v3.0.0, if you don't have it yet. You
can find it [here](https://nodejs.org).

2. Install local dependencies:

```
npm install
```

## Usage
The tool exposes an executable that can be used to set up the testing environment and start the accessibility tests.


#### Add to the package
```
"devDependency": {
  ...
  "metal-a11y": "^1.0.0",
  ...
}
```

#### Execute
```
metal-a11y [options]

Options:
  -h, --help      Show help                                            [boolean]
  -v, --version   Show version number                                  [boolean]
  -p, --packages  Execute a11y against all project in the specified directory
  -r, --root      Specifies the document root of the test server
  -c, --content   relative URL where the testable content can be found

```

## Examples

#### Test your HTML content
Provided your production ready html content is placed in project's `build/` folder and your entry point is `index.html`.

```
metal-a11y --root ./build --content index.html
```

#### Test multiple contents
You are able to execute the tests against multitple HTML contents. Provided your components production ready html content are placed in `components/[component_name]/build` folder and the entry points are `demo.html`.

```
metal-a11y --packages ./components --root ./build --content demo.html
```
