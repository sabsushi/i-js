COMMAND ?= start

up:
	docker compose up --build

build:
	docker build -t g-javascript .

run: build
	docker run -it -v ${shell pwd}:/app g-javascript npm run ${COMMAND}

bash: build
	docker run -it -v ${shell pwd}:/app g-javascript bash