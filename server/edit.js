import nodeOs from 'node:os';
import readjson from 'readjson';
import {tryToCatch} from 'try-to-catch';
import Edit from '../json/edit.json' with {
    type: 'json',
};

const HOME = nodeOs.homedir();

export default async (req, res, next) => {
    if (req.url !== '/edit.json')
        return next();
    
    const [error, data] = await tryToCatch(readEdit);
    
    if (error)
        return res
            .status(404)
            .send(error.message);
    
    res.json(data);
};

async function readEdit() {
    const homePath = `${HOME}/.edward.json`;
    const [error, edit] = await tryToCatch(readjson, homePath);
    
    if (!error)
        return {
            ...Edit,
            ...edit,
        };
    
    if (error.code !== 'ENOENT')
        throw Error(`edward --config ${homePath}: ${error.message}`);
    
    return Edit;
}
