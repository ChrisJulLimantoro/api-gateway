import { MicroserviceConnectionExceptionFilter } from './microservice-connection-exception.filter';

describe('MicroserviceConnectionExceptionFilter', () => {
  it('should be defined', () => {
    expect(new MicroserviceConnectionExceptionFilter()).toBeDefined();
  });
});
