const db = require("../database/dbConfig")

async function get() {
    return db("users")
        .select("id", "username")
}

async function add(user) {
    const [id] = await db("users")
        .insert(user)
    return getById(id)
}

function getBy(filter) {
    return db("users")
        .select("id", "username", "password")
        .where(filter)
}

function getById(id) {
    return db("users")
        .select("id", "username")
        .where({id})
        .first()
}

module.exports = {
    get,
    add,
    getBy,
    getById,
}