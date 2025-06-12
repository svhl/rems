# Rajagiri Event Management System

Simplify event management and activity point tracking for students and teachers at Rajagiri

## Features

REMS offers improved event management over the current system at Rajagiri by addressing shortcomings such as

❌ Event information is entered manually during certificate submission

❌ Each submission requires manual entry of activity points by teachers

❌ Unoptimized design for mobile devices

However, REMS provides a better user experience while maintaining functionality.

✅ Database of event info and activity points present to reduce manual input

✅ Dashboard for viewing past and upcoming events

✅ Responsive user interface for both desktop and mobile

## Tech stack

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E) ![MySQL](https://img.shields.io/badge/mysql-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white) ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)

## Screenshots

<img src="https://github.com/user-attachments/assets/fe4d79a8-e99a-4c5c-92af-5ad50e34eb43" width="600"/>

<img src="https://github.com/user-attachments/assets/b43a24ed-3fd0-49a4-8c15-65c1ca760508" width="600"/>

<img src="https://github.com/user-attachments/assets/b4f34a3b-0874-4fdd-8775-3b6d6200a2b6" width="600"/>

<img src="https://github.com/user-attachments/assets/f18a2853-379a-43fd-b012-e7eaa62ef8e5" width="600"/>

## Live hosting

The frontend and Node.js are hosted on [Render](https://render.com/), and the MySQL database is hosted on [Aiven](https://aiven.io/).

The site can be viewed at [rems.hopto.org](https://rems.hopto.org).

> [!IMPORTANT]
> The site may take ~1 min to load.
>
> Refer below for login credentials.

### Student login

| username | password |
| -------- | -------- |
| u0001    | u0001    |
| u0002    | u0002    |
| u0003    | u0003    |

### Teacher login

| username | password |
| -------- | -------- |
| t0001    | t0001    |
| t0002    | t0002    |
| t0003    | t0003    |

## Self-hosting

### Prerequisites

[Node.js](https://nodejs.org/en/download) and [MySQL](https://dev.mysql.com/downloads/mysql/) should be installed. Configure MySQL username as `root` and password as `password`. Run the commands within [database.txt](https://github.com/svhl/rems/blob/main/database.txt) in MySQL. Then, clone the repo and install the required modules.

```
git clone https://github.com/svhl/rems
cd rems
npm install
```

### Running

Start the server by running

```
node server.js
```

The site can be viewed at [http://localhost:3000](http://localhost:3000).

## Developers

Muhammed S. Suhail | [GitHub](https://github.com/svhl)

Deril Jose Thirunilath | [GitHub](https://github.com/deriljose)

Juan Jude Pereira | [GitHub](https://github.com/juanpereiira)

Geevar Saji Kuriakose | [GitHub](https://github.com/Geevar12)

## Copyright

REMS is not officially associated with Rajagiri. All copyrights belong to their respective owners.
