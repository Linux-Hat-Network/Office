from flask import Flask, flash, redirect, render_template, request, jsonify, url_for, make_response, send_file
from flask_sqlalchemy import SQLAlchemy
import random
import string
from werkzeug.utils import secure_filename
from datetime import date, datetime, timedelta
import json
from pathlib import Path
from requests import get, post
import os
import tarfile
import shutil

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
db = SQLAlchemy(app)

uploads = []

def getFolderSize(folder):
    total_size = os.path.getsize(folder)
    for item in os.listdir(folder):
        itempath = os.path.join(folder, item)
        if os.path.isfile(itempath):
            total_size += os.path.getsize(itempath)
        elif os.path.isdir(itempath):
            total_size += getFolderSize(itempath)
    return total_size - 4096

class Users(db.Model):
    __tablename__ = 'Users'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String)
    data_limit = db.Column(db.Integer) #octets

class Keys(db.Model):
    __tablename__ = 'Keys'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    user_id = db.Column(db.Integer)

class Notes(db.Model):
    __tablename__ = 'Notes'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    last_modif_date = db.Column(db.DateTime)
    content = db.Column(db.Integer)
    user_id = db.Column(db.Integer)

with app.app_context():
    db.create_all()    

def Key(key):
    with app.app_context():
        data = db.session.query(Keys).filter_by(name = key).first()
        if data:
            return data
        key_info = post("https://auth.linuxhat.net/api/key/getinfo", json={"key": key}).json()
        if key_info.get("user_id") :
            new_key = Keys(name = key, user_id = key_info.get("user_id"))
            db.session.add(new_key)
            db.session.commit()
            if not db.session.query(Users).filter_by(user_id = key_info.get("user_id")).first() :
                user = get(f"http://auth.linuxhat.net/api/user/{key_info.get('user_id')}").json()
                data_limit = 0
                if not user.get("is_admin"):
                    data_limit = 1000000
                new_user = Users(data_limit = data_limit, user_id = key_info.get("user_id"))
                db.session.add(new_user)
                db.session.commit()
                if not os.path.exists("../cloud"):
                    os.mkdir("../cloud")
                if not os.path.exists(f"../cloud/{key_info.get('user_id')}/"):
                    os.mkdir(f"../cloud/{key_info.get('user_id')}/")
            return db.session.query(Keys).filter_by(name = key).first()
        return False

# WEBSITE

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/notes')
def get_notes():
    return render_template('notes/index.html')

@app.route('/note')
def get_note():
    return render_template('notes/note.html')

@app.route('/note/new')
def new_note():
    return render_template('notes/new.html')

@app.route('/note/edit')
def edit_note():
    return render_template('notes/edit.html')

@app.route('/cloud')
def cloud():
    return render_template('cloud.html')

# API

@app.route("/api/user/new/note", methods=['POST'])
def api_new_note():
    data = request.get_json()
    key = data.get("key")
    key = Key(key)
    if not key :
        return "", 498
    note = Notes(name=data.get('name'), last_modif_date=datetime.now(), content=data.get('content'), user_id=key.user_id)
    db.session.add(note)
    db.session.commit()
    note = db.session.query(Notes).order_by(Notes.id.desc()).first()
    return jsonify({"id":note.id})

@app.route("/api/user/note/edit", methods=['POST'])
def api_edit_note():
    data = request.get_json()
    key = data.get("key")
    id= data.get("id")
    key = Key(key)
    if not key :
        return "", 498
    note = db.session.query(Notes).filter_by(id=id, user_id=key.user_id).first()
    if not note :
        return "", 404
    note.name = data.get('name')
    note.content = data.get('content')
    note.last_modif_date = datetime.now()
    db.session.commit()
    return jsonify({"id":note.id})

@app.route("/api/user/get-notes", methods=['POST'])
def api_get_notes():
    data = request.get_json()
    key = data.get("key")
    key = Key(key)
    if not key :
        return "", 498
    notes = db.session.query(Notes).filter_by(user_id=key.user_id).all()
    ans = []
    for note in notes:
        ans.append({"id":note.id, "name":note.name, "last_modif_date":note.last_modif_date, "content":note.content, "user_id":note.user_id})
    return jsonify({"notes":ans})

@app.route("/api/user/get-note", methods=['POST'])
def api_get_note():
    data = request.get_json()
    key = data.get("key")
    id= data.get("id")
    key = Key(key)
    if not key :
        return "", 498
    note = db.session.query(Notes).filter_by(id=id, user_id=key.user_id).first()
    if not note :
        return "", 404
    return jsonify({"id":note.id, "name":note.name, "last_modif_date":note.last_modif_date, "content":note.content, "user_id":note.user_id})


@app.route("/api/user/note/delete", methods=['POST'])
def api_delete_note():
    data = request.get_json()
    key = data.get("key")
    id= data.get("id")
    key = Key(key)
    if not key :
        return "", 498
    note = db.session.query(Notes).filter_by(id=id, user_id=key.user_id).first()
    if not note :
        return "", 200
    Notes.query.filter(Notes.id == id).delete()
    db.session.commit()
    return "", 200

@app.route("/api/user/cloud", methods=['POST'])
def cloud_load():
    data = request.get_json()
    key = Key(data.get("key"))
    if not key :
        return "", 498
    user_id= key.user_id
    key=key.name
    path= data.get("path")
    if ".." in path:
        return "", 444
    items = {"folders":[], "files":[]}
    try :
        diectory = os.listdir(f"cloud/{user_id}{path}")
    except:
        return "", 404
    for item in diectory:
        if os.path.isfile(f"cloud/{user_id}/{path}/{item}"):
            items.get("files").append(item)
        else:
            items.get("folders").append(item)

    size = getFolderSize(f"cloud/{user_id}")
    data_limit = db.session.query(Users).filter_by(user_id = user_id).first().data_limit
    
    return jsonify({"path":f"{path}", "items":items, "data":{"now":size, "data_limit":data_limit}})

@app.route("/api/user/cloud/download", methods=['POST'])
def cloud_download():
    data = request.get_json()
    key = Key(data.get("key"))
    if not key :
        return "", 498
    user_id= key.user_id
    key=key.name
    path= str(data.get("path"))
    if ".." in path:
        return "", 444
    if not os.path.exists(f"cloud/{user_id}{path}"):
        return "", 404
    if os.path.isfile(f"cloud/{user_id}{path}"):
        return send_file(f"cloud/{user_id}{path}")
    else:
        name = path.replace("/","")
        shutil.copytree(f"cloud/{user_id}{path}",f"{name}")
        with tarfile.open(f"{name}.tar", "w:gz") as tarhandle:
            for root, dirs, files in os.walk(name):
                for f in files:
                    tarhandle.add(os.path.join(root, f))
        ans = send_file(f"{name}.tar")
        shutil.rmtree(name)
        os.remove(f"{name}.tar") 
        return ans

@app.route("/api/user/cloud/new/folder", methods=["POST"])
def cloud_new_folder():
    data = request.get_json()
    key = Key(data.get("key"))
    if not key :
        return "", 498
    user_id= key.user_id
    key=key.name
    name=data.get("name")
    path= str(data.get("path"))
    if ".." in path or ".." in name:
        return "", 444
    if not os.path.exists(f"cloud/{user_id}{path}"):
        return "", 404
    if os.path.exists(f"cloud/{user_id}{path}{name}"):
        return "", 303
    os.mkdir(f"cloud/{user_id}{path}{name}")
    return "", 200

@app.route("/api/user/cloud/delete", methods=["POST"])
def cloud_deletre():
    data = request.get_json()
    key = Key(data.get("key"))
    if not key :
        return "", 498
    user_id= key.user_id
    key=key.name
    path= str(data.get("path"))
    if ".." in path:
        return "", 444
    if not os.path.exists(f"cloud/{user_id}{path}"):
        return "", 404
    if os.path.isfile(f"cloud/{user_id}/{path}"):
        os.remove(f"cloud/{user_id}{path}")
    else:
        shutil.rmtree(f"cloud/{user_id}{path}")
    return "", 200

@app.route("/api/user/cloud/ask/upload", methods=["POST"])
def cloud_ask_upload_file():
    data = request.get_json()#json.loads(request.form['data'])
    
    key = Key(data.get("key"))
    if not key :
        return "", 498
    user_id= key.user_id
    key=key.name
    filename = data.get("filename")
    path= str(data.get("path"))
    if ".." in path or ".." in filename:
        return "", 444
    if not os.path.exists(f"cloud/{user_id}{path}"):
        return "", 404
    if os.path.exists(f"cloud/{user_id}{path}{filename}"):
        return "", 303
    code = ""
    for i in range(8):
        code += random.choice(string.ascii_uppercase+string.ascii_lowercase+string.digits)
    url = "https://office.linuxhat.net/api/user/cloud/upload/" + code
    uploads.append({"code":code, "path":path, "filename":filename, "user_id":user_id})
    return jsonify({"url":url})

@app.route("/api/user/cloud/upload/<string:code>", methods=["POST"])
def cloud_upload_file(code):
    for upload in uploads :
        if upload["code"] == code:
            break
    uploads.remove(upload)
    path = upload["path"]
    filename = upload["filename"]
    user_id = upload["user_id"]
    file = request.data
    file_size = len(file) 
    size = getFolderSize(f"cloud/{user_id}")
    data_limit = db.session.query(Users).filter_by(user_id = user_id).first().data_limit
    if size + file_size > data_limit and data_limit:
        return "", 507
    with open(f'cloud/{user_id}{path}{filename}', 'wb') as f:
        f.write(file)
    return "", 200

app.run("127.0.0.1",8082,debug=True)