# Jobs-Finder

Jobs Finder is a job-search and monitoring application designed to help users discover and track employment opportunities from multiple company career websites.

The application allows users to configure career-page sources, scan them for available job opportunities, collect job information, and review the results through a centralized web-based dashboard.

## Features

* Monitor multiple company career websites
* Configure and enable or disable individual job sources
* Scan career pages for available job listings
* Collect and store job information locally
* Centralize job opportunities in a single dashboard
* Configure scanning sources through a JSON configuration file
* Support for filtering and reviewing collected job listings
* Lightweight architecture with minimal dependencies
* Windows startup script for convenient execution

## Architecture

```text
+---------------------------+
|   Configured Job Sources  |
|     (Career Websites)     |
+-------------+-------------+
              |
              v
+---------------------------+
|       Job Scanner         |
|        scanner.py         |
+-------------+-------------+
              |
              v
+---------------------------+
|       Job Data Store      |
|        jobs.json          |
+-------------+-------------+
              |
              v
+---------------------------+
|       Web Dashboard       |
| HTML / CSS / JavaScript   |
+---------------------------+
```

The scanner retrieves job information from configured sources and stores the collected data locally. The web dashboard provides an interface for reviewing the available opportunities.

## Project Structure

```text
Jobs-Finder/
│
├── index.html          # Main dashboard
├── styles.css          # Dashboard styles
├── script.js           # Frontend functionality
│
├── scanner.py          # Job scanning and data collection
├── jobs.json           # Collected job listings
├── settings.json       # Application and source configuration
│
├── start.bat           # Windows startup script
│
├── favicon.png         # Application favicon
├── logo.png            # Application logo
│
├── LICENSE             # Project license
└── README.md           # Project documentation
```

## Configuration

Job sources and application settings are managed through `settings.json`.

A source can be configured using the following structure:

```json
{
  "name": "Company Name",
  "url": "https://example.com/careers",
  "kind": "Company",
  "on": true,
  "note": ""
}
```

### Configuration Fields

| Field  | Description                                     |
| ------ | ----------------------------------------------- |
| `name` | Name of the company or job source               |
| `url`  | URL of the career or job page                   |
| `kind` | Classification of the source                    |
| `on`   | Determines whether the source is active         |
| `note` | Optional information associated with the source |

This configuration allows users to maintain and manage a centralized collection of career websites.

## Requirements

* Python 3.x
* Modern web browser
* Internet connection for scanning external career websites
* Windows operating system for the included `start.bat` script

## Platform Compatibility

Jobs Finder provides platform-specific versions to ensure compatibility across different operating systems.

| Platform | Branch      |
| -------- | ----------- |
| Windows  | `main`      |
| macOS    | `mac_linux` |
| Linux    | `mac_linux` |

The `main` branch is intended for **Windows** users.

Users running **macOS or Linux** should switch to the [`mac_linux`](https://github.com/NithilaLD/Jobs-Finder/tree/mac_linux) branch and follow the installation and usage instructions provided there.

Make sure to use the branch corresponding to your operating system before installing or running the application.

## Installation

Clone the repository:

```bash
git clone https://github.com/NithilaLD/Jobs-Finder.git
```

Navigate to the project directory:

```bash
cd Jobs-Finder
```

Configure the career sources in:

```text
settings.json
```

## Running the Application

### Run the Scanner

Execute the Python scanner:

```bash
python scanner.py
```

The scanner processes the configured sources and updates the locally stored job data.

### Open the Dashboard

Open:

```text
index.html
```

in a modern web browser.

### Windows

Windows users can use the included startup script:

```text
start.bat
```

to launch the application.

## Technologies

| Technology | Purpose                              |
| ---------- | ------------------------------------ |
| Python     | Job scanning and data processing     |
| HTML5      | Dashboard structure                  |
| CSS3       | User interface styling               |
| JavaScript | Dashboard functionality              |
| JSON       | Configuration and local data storage |

## Use Cases

Jobs Finder can be used by:

* Undergraduate students searching for internships
* Recent graduates looking for entry-level positions
* Software developers monitoring development opportunities
* Cybersecurity students tracking security-related positions
* Job seekers monitoring multiple company career pages
* Users who want to centralize job opportunities from different sources

## Future Development

Planned and potential improvements include:

* Automated scheduled scanning
* Advanced job filtering
* Keyword-based job matching
* Location-based filtering
* Remote, hybrid, and on-site filtering
* Internship and graduate-position filtering
* Salary-based filtering
* Company-based filtering
* Job deduplication
* New-job notifications
* Email notifications
* Job bookmarking
* Application status tracking
* Database integration
* AI-assisted job matching
* Resume-to-job matching
* Job relevance analysis
* Web-based deployment

## Data and Website Usage

Jobs Finder is designed to work with publicly available career information.

Users are responsible for ensuring that their use of the application complies with the terms of service, robots.txt policies, rate limits, and other applicable restrictions of the websites being monitored.

Job information should be verified on the original employer's career website before submitting an application.

## License

This project is licensed under the MIT License.

See the [LICENSE](LICENSE) file for details.

## Author

**Dulan Nithila Liyanarachchi**

GitHub: [NithilaLD](https://github.com/NithilaLD)

---

If you find the project useful, consider starring the repository.
