const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const c = require('../controllers/ingredientController');

router.use(auth);
router.get('/', c.list);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
