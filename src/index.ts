#!/usr/bin/env node
import configstore from 'configstore'; // config
import { Snipe } from 'snipe-it.js';
import prompts from 'prompts';
import chalk from 'chalk';
import figlet from 'figlet';
import ora from 'ora';

const conf = new configstore('ginit');

const spinner = ora({
  color: 'blue',
  spinner: 'bouncingBall',
  text: 'Loading...'
});

async function asyncFunction() {
  console.clear();
  console.log(
    chalk.magenta(figlet.textSync('Snipe-IT\nInventory-check', { horizontalLayout: 'Default' }))
  );

  if (!conf.get('snipeURL')) {
    // Gets creds. from user and stores them in config
    await prompts([
      {
        type: 'text',
        name: 'snipeURL',
        message: "What's the URL of your Snipe-IT instance?"
      },
      {
        type: 'password',
        name: 'snipeToken',
        message: "What's your API token?"
      }
    ]).then(async (res) => {
      try {
        conf.set('snipeURL', res.snipeURL);
        conf.set('snipeToken', res.snipeToken);
      } catch (err) {
        console.log(
          `${chalk.red.italic.bold('Error')} - Can't save the credentials\nError: ${err}`
        );
      }
    });
  }

  const snipe = new Snipe(conf.get('snipeURL'), conf.get('snipeToken'));

  spinner.start('Fetching resources from Snipe-IT...');

  let assets;
  let categories;

  try {
    assets = await snipe.hardware.get({ limit: 10000 }); // retrieve all the assets
    categories = await snipe.categories.get({ limit: 10000 }); // retrieve all the categories
  } catch (err) {
    spinner.stop();
    console.log(
      `${chalk.red.italic.bold('Error')} - Can't fetch assets and/or locations.\n${chalk.bold.red(
        'Make sure that you have the correct permissions, URL and API token!'
      )}\nError: ${err}`
    );
    conf.clear();
    process.exit();
  }
  const assetArray: { title: string; value: any }[] = [];
  const categoriesArray: { title: string; value: any }[] = [];

  assets.forEach((hardware) => {
    assetArray.push({
      title: `${hardware.asset_tag} | ${hardware.name}`,
      value: hardware.id
    });
  });

  categories.forEach((category) => {
    categoriesArray.push({
      title: category.name,
      value: category.id
    });
  });

  assetArray.push({
    title: 'Stop',
    value: 'stop'
  });

  categories.push({
    title: 'All',
    value: 'all'
  });
}

asyncFunction();
