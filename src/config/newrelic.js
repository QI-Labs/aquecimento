/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */

exports.config = {
  /**
   * Array of application names.
   */
  app_name : ['Qi Labs'],
  // app_name: [require('./app/lib/config').getConfigValue('server', 'name')],
  /**
   * Your New Relic license key.
   */
  license_key : '', // defined locally
  // license_key: require('./app/lib/config').getConfigValue('newrelic', 'key'),
  logging : {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level : 'info'
    // level: require('./app/lib/config').getConfigValue('newrelic', 'level'),
    /**
     * Dir to save log file
     */
    // filepath: './logs/newrelic_agent.log'
  }
};