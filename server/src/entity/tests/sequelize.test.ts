import 'server/src/tests/setupEnvironment';
import { getSequelize } from 'server/src/entity/sequelize.ts';

test('Ensure all models can be loaded', async () => {
  const sequelize = getSequelize();
  for (const [name, model] of Object.entries(sequelize.models)) {
    try {
      await model.findOne();
    } catch (e) {
      throw new Error(`Error in model ${name}`);
    }
  }
});
