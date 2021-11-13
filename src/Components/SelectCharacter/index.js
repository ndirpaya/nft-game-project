import React, { useEffect, useState } from 'react';
import './SelectCharacter.css';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants';
import myEpicGame from '../../utils/MyEpicGame.json';
import LoadingIndicator from '../LoadingIndicator';

const SelectCharacter = ({ setCharacterNFT }) => {
    const [characters, setCharacters] = useState([]);
    const [gameContract, setGameContract] = useState(null);

    const [mintingCharacter, setMintingCharacter] = useState(false);

    useEffect(() =>  {
        const { ethereum } = window;

        if (ethereum) {
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();
            const gameContract = new ethers.Contract(
                CONTRACT_ADDRESS,
                myEpicGame.abi,
                signer
            );

            /**
             *  Set our contract in state.
             */
            setGameContract(gameContract);
        } else {
            console.log('Ethereum object not found');
        }
    }, []);

    useEffect(() => {
        const getCharacters = async () => {
            try {
                console.log('Getting contract characters to mint');

                /**
                 *  Call contract to get all mint-able characters
                 */
                const charactersTxn = await gameContract.getAllDefaultCharacters();
                console.log('charactersTxn:', charactersTxn);

                /**
                 *  Go through all our characters and transform the data
                 */
                const characters = charactersTxn.map((characterData) =>
                    transformCharacterData(characterData)
                );

                /**
                 *  Set all mint-able characters in state
                 */
                setCharacters(characters);
            } catch (error) {
                console.error('Something went wrong fetching characters:', error);
            }
        };

        /**
         *  Add a callback method that will fire when this event is received
         */
        const onCharacterMint = async (sender, tokenId, characterIndex) => {
            console.log(
                `CharacterNFTMinted - sender: ${sender} tokenId: ${tokenId.toNumber()} characterIndex: ${characterIndex.toNumber()}`
            );

            /**
             *  Once character NFT is minted we can fetch the metadata from our
             *  contract and set it in state to move onto the Arena
             * 
             */
            if (gameContract) {
                const characterNFT = await gameContract.checkIfUserHasNFT();
                console.log('CharacterNFT: ', characterNFT);
                setCharacterNFT(transformCharacterData(characterNFT));
            }
        };
        if (gameContract) {
            getCharacters();

            /**
             *  Setup NFT Minted Listener
             */
            gameContract.on('CharacterNFTMinted', onCharacterMint);
        }

        return () => {
            /**
             *  When component unmounts, make sure to clearn up this listener
             */
            if (gameContract) {
                gameContract.off('CharacterNFTMinted', onCharacterMint);
            }
        };
    }, [gameContract]);

    const renderCharacters = () =>
        characters.map((character, index) => (
            <div className="character-item" key="{character.name}">
                <div className="name-container">
                    <p>{character.name}</p>
                </div>
                <img src={character.imageURI} alt={character.name} />
                <button
                    type="button"
                    className="character-mint-button"
                    onClick={mintCharacterNFTAction(index)}
                >{`Mint ${character.name}`}</button>
            </div>
    ));

    const mintCharacterNFTAction = (characterId) => async () => {
        try {
            if (gameContract) {
                /**
                 * show loading indicator
                 */
                setMintingCharacter(true);
                console.log('Minting character in progress...');
                const mintTxn = await gameContract.mintCharacterNFT(characterId);
                await mintTxn.wait();
                console.log('mintTxn:', mintTxn);

                setMintingCharacter(false);
            }
        } catch (error) {
            console.warn('MintCharacterAction Error', error);

            setMintingCharacter(false);
        }
    };

    return (
        <div className="select-character-container">
            <h2>Mint your Hero. Choose wisely</h2>
            {characters.length > 0 && (
                <div className="character-grid">{renderCharacters()}</div>
            )}
            {mintingCharacter && (
                <div className="loading">
                    <div className="indicator">
                        <LoadingIndicator />
                        <p>Minting in Progress...</p>
                    </div>
                    <img
                        src="https://warwick.ac.uk/fac/sci/mathsys/news/newsletter/student_experience/msc-term-1/1pm.gif"
                        alt="Minting loading indicator"
                    />
                </div>
            )}
        </div>
    );
};

export default SelectCharacter;