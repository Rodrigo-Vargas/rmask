import { expect } from "chai"

import RMask from '../src/rmask.class';

describe('RMask Library', function () {
   it('should create an instance of RMask', () => {
      const rmask = new RMask('#input');
      expect(rmask).to.be.an.instanceof(RMask);
   });
});
