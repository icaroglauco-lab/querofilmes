#!/usr/bin/env node
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const argv = yargs(hideBin(process.argv)).argv;
const TorrentSearchApi = require("torrent-search-api");
const inquirer = require("inquirer");
const fs = require('fs');
const {exec} = require('child_process');

// Provider enabling
TorrentSearchApi.enableProvider("ThePirateBay");

type MagnetLink = string;
// The pirate bay provider gives you the following structure eg:
type Torrent = {
	provider: string;
	id: string;
	title: string;
	time: string;
	seeds: number;
	peers: number;
	size: string;
	magnet: MagnetLink;
	numFiles: number;
	status: string;
	category: string;
	imdb: string;
};

// Parse multiple movie names into separeted quee function lines
function parseMain() {
	let { titulo, filmes, para, lista } = argv;
	let titles = filmes.split(",");
	
	if(!fs.existsSync(para)){
		fs.mkdirSync(para);
	}

	Promise.all(searchMovieWithTitles(titulo, titles, lista)).then(
		processFinishedSearchResults(titulo, titles, para)
	);
}

const processFinishedSearchResults = (movieName, movieTitlesArr, destinationPath) => (TorrentResults: Array<any>) => {
			const promptStructure = movieTitlesArr.map((subTitle, i) => ({
				type: "checkbox",
				name: `${movieName} ${subTitle}`,
				message: `Which titles from ${movieName} ${subTitle} do you want to download?`,
				choices: TorrentResults[i].map(
					(result) => (`${result.title}-(S:${result.seeds};P${result.peers})`)
				),
			}));

			inquirer.prompt(promptStructure).then(processPromptChoices({destinationPath, TorrentResults}));
		} 

	const processPromptChoices = ({destinationPath, TorrentResults}) => (results) => {
		 const processedMovieChoices = Object.keys(results).map(
			 (resultPromptKey, keyIndex) => {
				 return {
					 id: resultPromptKey,
					 "movie files": results[
						 resultPromptKey
					 ].map((choiceValue) =>
							 TorrentResults[
								 keyIndex
							 ].find( (d) => choiceValue.includes(d.title) )
						 ),
				 };
			 }
		 );
		 queeUpToDownload(processedMovieChoices, destinationPath);
   }

// Search based on argument filme
const searchMovieWithTitles = (title, subTitles, n) => {
	return subTitles.map((subTitle) =>
		TorrentSearchApi.search(`${title} ${subTitle}`, "Video", n)
	);
};

const queeUpToDownload = (fullDownloadDataArray:Array<any>, basePath:string) => {
	fullDownloadDataArray.forEach(  downloadDataArray => 
		downloadDataArray['movie files'].forEach( prepareDownload(basePath) )
	);
}

const prepareDownload = (basePath ) => async (downloadedData) => {
	// TODO
	if (!fs.existsSync(`${basePath}/${downloadedData.title}/`)){
		fs.mkdirSync(`${basePath}/${downloadedData.title}/`);
	}
	downloadTorrent(downloadedData.magnet, `${basePath}/${downloadedData.title}/`);
};

const downloadTorrent = async (magnet, location) => {
	// TODO
	console.log(location);
	exec(`kitty --detach ./node_modules/webtorrent-cli/bin/cmd.js "${magnet}" --out="${location}"`);
}
parseMain();
