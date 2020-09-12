const { expectCt } = require("helmet")
const supertest = require("supertest")
const server = require("../api/server")
const { intersect } = require("../database/dbConfig")
const db = require("../database/dbConfig")

const defaultCredentials = {
    username: "lambda",
    password: "testing123"
}

beforeEach((done) => {
    db.migrate.rollback().then(() => {
        db.migrate.latest().then(() => {
            done()
        })
    })
})

afterAll(async() => {
    await db.destroy()
})

describe("dad jokes integration tests", () => {
    it("GET / get the welcome page", async () => {
        const res = await supertest(server).get("/api")
        expect(res.type).toBe("application/json")
        expect(res.body.message).toBe("Welcome to Dad Jokes!")
    })

    it("GET /api/jokes should return 401 if not authenticated", async () => {
        const res = await supertest(server).get("/api/jokes")
        expect(res.status).toBe(401)
    })

	it("GET /api/jokes", async () => {
		// register new user
		await supertest(server).post("/api/auth/register").send(defaultCredentials);

		// Login to get access token
		const accessToken = (
			await supertest(server).post("/api/auth/login").send(defaultCredentials)
		).body.token;

		const res = await supertest(server)
			.get("/api/jokes")
			.set("token", accessToken);

		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(20);
    })
    
    it("POST / register new user", async () => {
        const res = await supertest(server).post("/api/auth/register")
        .send(defaultCredentials)
        expect(res.statusCode).toBe(201)
        expect(res.type).toBe("application/json")
        expect(res.body.id).toBeDefined()
        expect(res.body.username).toEqual(defaultCredentials.username)
    })

    it("POST /register should return 409 when username exist", async () => {
		// register new user
		await supertest(server).post("/api/auth/register").send(defaultCredentials);

		//try to register with same credentials
		const res = await supertest(server)
			.post("/api/auth/register")
			.send(defaultCredentials);
		expect(res.status).toBe(409);
		expect(res.body.message).toMatch("Username is already taken");
    })
    
    it("POST /api/auth/login", async () => {
		// register new user
		await supertest(server).post("/api/auth/register").send(defaultCredentials)

		//login with registered credentials
		const res = await supertest(server)
			.post("/api/auth/login")
			.send(defaultCredentials)
		expect(res.status).toBe(200)
		expect(res.body.token).toBeTruthy()
    })
    
	it("GET /api/auth/logout", async () => {
		// register new user
		await supertest(server)
			.post("/api/auth/register")
			.send(defaultCredentials)
			.expect(201)
		// Login to get access token
		const accessToken = (
			await supertest(server).post("/api/auth/login").send(defaultCredentials)
		).body.token
		// Logout
		await supertest(server)
			.get("/api/auth/logout")
			.set("Authorization", `Bearer ${accessToken}`)
			.expect(200)
		// Test if access token is revoked
		await supertest(server)
			.get("/api/jokes")
			.set("Authorization", `Bearer ${accessToken}`)
			.expect(401)
	})

})